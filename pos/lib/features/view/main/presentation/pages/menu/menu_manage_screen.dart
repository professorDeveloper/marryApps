import 'dart:io' show File;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:file_selector/file_selector.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/list_extension.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/service/minio/minio_service.dart';
import 'package:mary_ai_pos/core/utils/app_formatter.dart';
import 'package:mary_ai_pos/core/utils/user_role_permissions.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/core/widgets/app_scaffold.dart';
import 'package:mary_ai_pos/core/widgets/global_virtual_keyboard.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/data/models/category/category_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/main_header.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class MenuManageScreen extends StatefulWidget {
  const MenuManageScreen({super.key});

  @override
  State<MenuManageScreen> createState() => _MenuManageScreenState();
}

enum _AvailableItemsTab { ingredients, semiFinished }

class _MenuManageScreenState extends State<MenuManageScreen> {
  final DioClient _client = inject<DioClient>();
  final _nameCtrl = TextEditingController();
  final _nameEnCtrl = TextEditingController();
  final _nameRuCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _cookTimeCtrl = TextEditingController(text: '0');
  final _pictureUrlCtrl = TextEditingController();

  List<CategoryModel> _categories = const [];
  CategoryModel? _selectedCategory;
  bool _isLoadingCategories = true;
  bool _isLoadingMeal = false;
  bool _isSubmitting = false;
  String? _categoriesError;
  String? _editMealId;
  String? _nameTranslationId;
  String? _descriptionTranslationId;
  List<Map<String, dynamic>> _ingredientCalculations = const [];
  List<Map<String, dynamic>> _compoundCalculations = const [];
  bool _argsHandled = false;

  /// `goodWithCalculations` muvaffaqiyatli bo‘lsa true; faqat `goodById` bo‘lsa expandda qayta yuklash.
  bool _itemsLoadedWithMeal = false;
  bool _loadingItems = false;
  bool _loadingAvailableItems = false;
  String? _availableItemsError;
  List<Map<String, dynamic>> _availableIngredients = const [];
  List<Map<String, dynamic>> _availableCompounds = const [];
  _AvailableItemsTab _activeTab = _AvailableItemsTab.ingredients;
  final TextEditingController _availableSearchCtrl = TextEditingController();
  String _availableSearchQuery = '';
  final Map<String, TextEditingController> _qtyCtrls = {};
  final Map<String, Map<String, dynamic>> _translationsById = {};
  bool _translationsLoading = false;
  bool _uploadingImage = false;

  bool get _isEditMode => _editMealId != null && _editMealId!.isNotEmpty;

  void _onPictureUrlChanged() {
    if (mounted) setState(() {});
  }

  double? _parsePriceField() {
    final raw = _priceCtrl.text
        .replaceAll(RegExp(r'\s'), '')
        .replaceAll(',', '.');
    return double.tryParse(raw);
  }

  Future<void> _pickAndUploadImage() async {
    if (_isSubmitting || _uploadingImage) return;
    final imageGroup = XTypeGroup(
      label: S.current.strImages,
      extensions: const ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    );
    final XFile? picked;
    try {
      picked = await openFile(acceptedTypeGroups: [imageGroup]);
    } on PlatformException catch (e) {
      if (!mounted) return;
      showErrorMessage(
        context,
        e.code == 'channel-error'
            ? 'Не удалось открыть выбор файла. Пересоберите приложение (flutter clean → Run) или укажите ссылку на изображение.'
            : 'Выбор файла: ${e.message ?? e.code}',
      );
      return;
    }
    if (picked == null) return;

    final path = picked.path;
    if (path.isNotEmpty) {
      final file = File(path);
      final len = await file.length();
      if (len > 5 * 1024 * 1024) {
        if (!mounted) return;
        showErrorMessage(context, S.current.strFileTooLarge);
        return;
      }
      setState(() => _uploadingImage = true);
      try {
        final url = await MinioService.instance.postImage(file);
        if (!mounted) return;
        if (url != null && url.isNotEmpty) {
          _pictureUrlCtrl.text = url;
        } else {
          showErrorMessage(context, S.current.strUploadFailed);
        }
      } catch (_) {
        if (!mounted) return;
        showErrorMessage(context, S.current.strUploadError);
      } finally {
        if (mounted) setState(() => _uploadingImage = false);
      }
      return;
    }

    final bytes = await picked.readAsBytes();
    if (bytes.length > 5 * 1024 * 1024) {
      if (!mounted) return;
      showErrorMessage(context, S.current.strFileTooLarge);
      return;
    }
    setState(() => _uploadingImage = true);
    try {
      final name = picked.name.isNotEmpty ? picked.name : 'image.jpg';
      final url = await MinioService.instance.postImageBytes(
        bytes,
        filename: name,
      );
      if (!mounted) return;
      if (url != null && url.isNotEmpty) {
        _pictureUrlCtrl.text = url;
      } else {
        showErrorMessage(context, S.current.strUploadFailed);
      }
    } catch (_) {
      if (!mounted) return;
      showErrorMessage(context, S.current.strUploadError);
    } finally {
      if (mounted) setState(() => _uploadingImage = false);
    }
  }

  /// Web `MaryAiFront`: `GET /goods/{id}` + `GET /translations?limit=1000` parallel.
  Future<Response?> _safeGet(Future<Response> request) async {
    try {
      return await request;
    } on DioException {
      return null;
    }
  }

  void _fillTranslationsCacheFromResponse(dynamic raw) {
    final list = _extractDataList(raw);
    for (final row in list) {
      final id = (row['id'] ?? '').toString();
      if (id.isEmpty) continue;
      _translationsById[id] = row;
    }
  }

  /// Web `enrichMeal()`: `name_en` / `name_ru` ← translations map[`name_i18n`], yo‘q bo‘lsa `name`.
  void _applyNameEnRuFromTranslationCache(Map<String, dynamic> good) {
    final fallback = (good['name'] ?? '').toString();
    final nameI18n = (good['name_i18n'] ?? '').toString();
    if (nameI18n.isEmpty) {
      _nameEnCtrl.text = fallback;
      _nameRuCtrl.text = fallback;
      return;
    }
    final t = _translationsById[nameI18n];
    if (t == null) {
      _nameEnCtrl.text = fallback;
      _nameRuCtrl.text = fallback;
      return;
    }
    _nameEnCtrl.text = (t['en'] ?? fallback).toString();
    _nameRuCtrl.text = (t['ru'] ?? fallback).toString();
  }

  /// Asosiy forma maydonlari — faqat `good` obyektidan (web `useGetMeal`).
  void _applyGoodForForm(Map<String, dynamic> good) {
    _nameCtrl.text = (good['name'] ?? '').toString();
    _descriptionCtrl.text = (good['description'] ?? '').toString();
    _priceCtrl.text = AppFormatter.formatPriceIntegerSpaces(
      (good['price'] ?? '').toString(),
    );
    _cookTimeCtrl.text = (good['cook_time'] ?? '0').toString();
    _pictureUrlCtrl.text = (good['picture_url'] ?? '').toString();

    final ni = (good['name_i18n'] ?? '').toString();
    final di = (good['description_i18n'] ?? '').toString();
    _nameTranslationId = ni.isNotEmpty ? ni : null;
    _descriptionTranslationId = di.isNotEmpty ? di : null;

    _applyNameEnRuFromTranslationCache(good);

    if (_categories.isNotEmpty) {
      final cid = (good['category_id'] ?? '').toString();
      final matched = _categories.firstWhereOrNull((c) => c.id == cid);
      if (matched != null) _selectedCategory = matched;
    }
    if (mounted) setState(() {});
  }

  /// Faqat calculations — web `useGetMealWithCalculations`.
  void _applyCalculationsOnly(Map<String, dynamic> data) {
    final parsed = _parseCalculationBuckets(data);
    _ingredientCalculations = parsed.ingredients;
    _compoundCalculations = parsed.compounds;
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    _pictureUrlCtrl.addListener(_onPictureUrlChanged);
    _loadCategories();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_argsHandled) return;
    _argsHandled = true;
    final args = ModalRoute.of(context)?.settings.arguments;
    String? mealId;
    if (args is String && args.isNotEmpty) mealId = args;
    if (args is Map) {
      final raw = args['meal_id'];
      if (raw != null && raw.toString().trim().isNotEmpty) {
        mealId = raw.toString();
      }
    }
    if (mealId != null && mealId.isNotEmpty) {
      _editMealId = mealId;
      _loadMealForEdit(mealId);
    }
  }

  Future<void> _loadCategories() async {
    setState(() {
      _isLoadingCategories = true;
      _categoriesError = null;
    });
    try {
      final res = await _client.get(ListAPI.categories);
      final list =
          (res.data['data'] as List?)
              ?.map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <CategoryModel>[];
      if (!mounted) return;
      setState(() {
        _categories = list;
        _selectedCategory = list.isNotEmpty ? list.first : null;
        _isLoadingCategories = false;
      });
      final editId = _editMealId;
      if (editId != null && editId.isNotEmpty && !_isLoadingMeal) {
        await _loadMealForEdit(editId);
      }
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingCategories = false;
        _categoriesError = e.response?.data is Map
            ? e.response!.data['message']?.toString()
            : null;
      });
    }
  }

  Future<void> _loadMealForEdit(String mealId) async {
    if (_isLoadingMeal) return;
    setState(() => _isLoadingMeal = true);
    try {
      // Web MaryAiFront: parallel `GET /goods/{id}` + `GET /translations?limit=1000` + `with-calculations`.
      final futures = await Future.wait([
        _safeGet(_client.get(ListAPI.goodById(mealId))),
        _safeGet(_client.get(ListAPI.translations(limit: 1000, offset: 0))),
        _safeGet(_client.get(ListAPI.goodWithCalculationsById(mealId))),
      ]);
      final goodRes = futures[0];
      final transRes = futures[1];
      final calcRes = futures[2];

      if (transRes != null) {
        _fillTranslationsCacheFromResponse(transRes.data);
      }

      final calcData = calcRes != null
          ? (calcRes.data['data'] ?? const {}) as Map<String, dynamic>
          : null;

      if (goodRes != null) {
        final good = (goodRes.data['data'] ?? const {}) as Map<String, dynamic>;
        _applyGoodForForm(good);
        if (calcData != null) {
          _applyCalculationsOnly(calcData);
          _itemsLoadedWithMeal = true;
        } else {
          _ingredientCalculations = const [];
          _compoundCalculations = const [];
          _itemsLoadedWithMeal = false;
        }
      } else if (calcData != null) {
        // Faqat with-calculations — bitta response bilan forma + calculations (eski uslub).
        _applyMealData(calcData);
        await _hydrateNameTranslationFromList();
        _itemsLoadedWithMeal = true;
      } else {
        await _loadMealForEditFallback(mealId);
      }
    } on DioException {
      await _loadMealForEditFallback(mealId);
    } finally {
      if (mounted) setState(() => _isLoadingMeal = false);
    }
  }

  Future<void> _loadMealForEditFallback(String mealId) async {
    try {
      final res = await _client.get(
        ListAPI.goodWithCalculationsById(mealId),
        queryParameters: const {'include': 'translations'},
      );
      final data = (res.data['data'] ?? const {}) as Map<String, dynamic>;
      _applyMealData(data);
      await _hydrateNameTranslationFromList();
      _itemsLoadedWithMeal = true;
    } catch (_) {}
  }

  void _applyMealData(Map<String, dynamic> data) {
    final good = ((data['good'] is Map<String, dynamic>)
        ? data['good'] as Map<String, dynamic>
        : data);
    final parsed = _parseCalculationBuckets(data);
    _ingredientCalculations = parsed.ingredients;
    _compoundCalculations = parsed.compounds;

    _nameCtrl.text = (good['name'] ?? '').toString();
    _descriptionCtrl.text = (good['description'] ?? '').toString();
    _priceCtrl.text = AppFormatter.formatPriceIntegerSpaces(
      (good['price'] ?? '').toString(),
    );
    _cookTimeCtrl.text = (good['cook_time'] ?? '0').toString();
    _pictureUrlCtrl.text = (good['picture_url'] ?? '').toString();

    final ni = (good['name_i18n'] ?? '').toString();
    final di = (good['description_i18n'] ?? '').toString();
    _nameTranslationId = ni.isNotEmpty ? ni : null;
    _descriptionTranslationId = di.isNotEmpty ? di : null;

    final tName = data['name_translation'];
    if (tName is Map<String, dynamic>) {
      _nameEnCtrl.text = (tName['en'] ?? '').toString();
      _nameRuCtrl.text = (tName['ru'] ?? '').toString();
    } else {
      _nameEnCtrl.clear();
      _nameRuCtrl.clear();
    }
    // Web `enrichMeal`: `include=translations` bo‘lmasa `name_translation` kelmaydi —
    // shunda ham `name_i18n` + translations list yoki kamida `name` bilan to‘ldiramiz.
    final needEnRuFallback =
        tName is! Map<String, dynamic> ||
        (_nameEnCtrl.text.trim().isEmpty && _nameRuCtrl.text.trim().isEmpty);
    if (needEnRuFallback) {
      _applyNameEnRuFromTranslationCache(good);
    }

    if (_categories.isNotEmpty) {
      final cid = (good['category_id'] ?? '').toString();
      final matched = _categories.firstWhereOrNull((c) => c.id == cid);
      if (matched != null) _selectedCategory = matched;
    }
    if (mounted) setState(() {});
  }

  Future<void> _hydrateNameTranslationFromList() async {
    final translationId = _nameTranslationId;
    if (translationId == null || translationId.isEmpty) return;

    final fallbackName = _nameCtrl.text;
    final cached = _translationsById[translationId];
    if (cached != null) {
      _nameEnCtrl.text = (cached['en'] ?? fallbackName).toString();
      _nameRuCtrl.text = (cached['ru'] ?? fallbackName).toString();
      return;
    }

    if (_translationsLoading) return;
    _translationsLoading = true;
    try {
      final res = await _client.get(
        ListAPI.translations(limit: 1000, offset: 0),
      );
      final list = _extractDataList(res.data);
      for (final row in list) {
        final id = (row['id'] ?? '').toString();
        if (id.isEmpty) continue;
        _translationsById[id] = row;
      }

      final row = _translationsById[translationId];
      if (row != null) {
        _nameEnCtrl.text = (row['en'] ?? fallbackName).toString();
        _nameRuCtrl.text = (row['ru'] ?? fallbackName).toString();
      } else {
        _nameEnCtrl.text = fallbackName;
        _nameRuCtrl.text = fallbackName;
      }
    } on DioException {
      // optional source for edit form; silently skip if backend blocks this call.
    } finally {
      _translationsLoading = false;
    }
  }

  Future<String?> _upsertTranslation(
    String? existingId, {
    required String en,
    required String ru,
    required String uz,
  }) async {
    if (en.trim().isEmpty && ru.trim().isEmpty && uz.trim().isEmpty) {
      return existingId;
    }
    final body = {'en': en, 'ru': ru, 'uz': uz};
    if (existingId != null && existingId.isNotEmpty) {
      await _client.put(ListAPI.translationById(existingId), data: body);
      return existingId;
    }
    final res = await _client.post(ListAPI.createTranslation, data: body);
    final data = res.data['data'];
    if (data is Map<String, dynamic>) {
      return (data['id'] ?? '').toString();
    }
    return existingId;
  }

  Map<String, String> _scopeHeaders(UserModel? u) {
    final headers = <String, String>{};
    if (u == null) return headers;
    if (u.brandId.trim().isNotEmpty) headers['X-Brand-Id'] = u.brandId.trim();
    if (u.branchId.trim().isNotEmpty) {
      headers['X-Branch-ID'] = u.branchId.trim();
    }
    return headers;
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    final category = _selectedCategory;
    final user = context.read<UserBloc>().state.userMOdel;
    final name = _nameCtrl.text.trim();
    final nameEn = _nameEnCtrl.text.trim();
    final nameRu = _nameRuCtrl.text.trim();
    final description = _descriptionCtrl.text.trim();
    final price = _parsePriceField();
    final cookTime = int.tryParse(_cookTimeCtrl.text.trim()) ?? 0;

    if (name.isEmpty || category == null || price == null || price <= 0) {
      showErrorMessage(context, S.current.strRequiredFields);
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final nameTransId = await _upsertTranslation(
        _nameTranslationId,
        en: nameEn,
        ru: nameRu,
        uz: name,
      );
      final descTransId = await _upsertTranslation(
        _descriptionTranslationId,
        en: description,
        ru: description,
        uz: description,
      );

      final payload = {
        'good': {
          'name': name,
          'name_i18n': nameTransId ?? '',
          'description': description,
          'description_i18n': descTransId ?? '',
          'price': price.toString(),
          'cost_price': '0',
          'profit': '0',
          'profit_margin': '0',
          'cook_time': cookTime,
          'category_id': category.id,
          'department_id': category.departmentId ?? '',
          'picture_url': _pictureUrlCtrl.text.trim(),
          'color_code': null,
        },
        'ingredient_calculations': _ingredientCalculations,
        'compound_calculations': _compoundCalculations,
      };

      final headers = _scopeHeaders(user);
      if (_isEditMode) {
        await _client.put(
          ListAPI.goodWithCalculationsById(_editMealId!),
          data: payload,
          headers: headers,
        );
      } else {
        await _client.post(
          ListAPI.goodsWithCalculations,
          data: payload,
          headers: headers,
        );
      }

      if (!mounted) return;
      _nameTranslationId = nameTransId;
      _descriptionTranslationId = descTransId;
      showSuccessMessage(
        context,
        _isEditMode
            ? 'Позиция меню успешно обновлена'
            : 'Позиция меню успешно добавлена',
      );
      if (_isEditMode) {
        // SnackBar bir kadrdan keyin yopish — aks holda route bilan birga yo‘qoladi.
        await Future<void>.delayed(const Duration(milliseconds: 450));
        if (!mounted) return;
        if (Navigator.canPop(context)) {
          Navigator.of(context).pop(true);
        } else {
          navigatorKey.currentState?.pop(true);
        }
      } else {
        _clearForm();
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final message = e.response?.data is Map
          ? (e.response!.data['message']?.toString() ?? 'Ошибка сохранения')
          : 'Ошибка сохранения';
      showErrorMessage(context, message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _confirmDelete() async {
    final id = _editMealId;
    if (id == null || id.isEmpty) return;
    final ok = await showDialog<bool>(
      context: context,
      barrierColor: Colors.black.withOpacity(0.55),
      builder: (_) => _DeleteMealDialog(mealName: _nameCtrl.text.trim()),
    );
    if (ok != true) return;
    if (!mounted) return;
    setState(() => _isSubmitting = true);
    try {
      await _client.delete(ListAPI.goodById(id));
      if (!mounted) return;
      showSuccessMessage(context, "O'chirildi");
      await Future<void>.delayed(const Duration(milliseconds: 350));
      if (!mounted) return;
      if (Navigator.canPop(context)) {
        Navigator.of(context).pop(true);
      } else {
        navigatorKey.currentState?.pop(true);
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = e.response?.data is Map
          ? (e.response!.data['message']?.toString() ?? "O'chirilmadi")
          : "O'chirilmadi";
      showErrorMessage(context, msg);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _clearForm() {
    _nameCtrl.clear();
    _nameEnCtrl.clear();
    _nameRuCtrl.clear();
    _descriptionCtrl.clear();
    _priceCtrl.clear();
    _cookTimeCtrl.text = '0';
    _pictureUrlCtrl.clear();
    _nameTranslationId = null;
    _descriptionTranslationId = null;
    _ingredientCalculations = const [];
    _compoundCalculations = const [];
    _itemsLoadedWithMeal = false;
    setState(() {});
  }

  Future<void> _fetchItemsFromApi() async {
    final id = _editMealId;
    if (id == null || id.isEmpty) return;
    if (_loadingItems) return;
    setState(() => _loadingItems = true);
    try {
      final res = await _client.get(
        ListAPI.goodWithCalculationsById(id),
        queryParameters: const {'include': 'translations'},
      );
      final data = (res.data['data'] ?? const {}) as Map<String, dynamic>;
      final parsed = _parseCalculationBuckets(data);
      if (!mounted) return;
      setState(() {
        _ingredientCalculations = parsed.ingredients;
        _compoundCalculations = parsed.compounds;
        _itemsLoadedWithMeal = true;
      });
    } on DioException {
      if (!mounted) return;
      showErrorMessage(context, S.current.strLoadCompositionError);
    } finally {
      if (mounted) setState(() => _loadingItems = false);
    }
  }

  Future<void> _onItemsExpansionChanged(bool expanded) async {
    if (!expanded) return;
    await _loadItemsPanelData();
  }

  Future<void> _loadItemsPanelData() async {
    if (!_loadingAvailableItems &&
        _availableIngredients.isEmpty &&
        _availableCompounds.isEmpty) {
      await _fetchAvailableItemsFromApi();
    }
    if (!_isEditMode || _editMealId == null || _itemsLoadedWithMeal) return;
    await _fetchItemsFromApi();
  }

  Future<void> _fetchAvailableItemsFromApi() async {
    if (_loadingAvailableItems) return;
    setState(() {
      _loadingAvailableItems = true;
      _availableItemsError = null;
    });
    try {
      final ingredients = await _fetchFirstAvailableList([
        const _FetchAttempt(path: '/api/v1/ingredients'),
        const _FetchAttempt(path: '/api/v1/ingredients-lang'),
      ]);
      final compounds = await _fetchFirstAvailableList([
        const _FetchAttempt(path: '/api/v1/compounds'),
        const _FetchAttempt(path: '/api/v1/compounds-lang'),
      ]);
      if (!mounted) return;
      setState(() {
        _availableIngredients = ingredients;
        _availableCompounds = compounds;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _availableItemsError = e.response?.data is Map
            ? (e.response!.data['message']?.toString() ?? 'Ошибка загрузки')
            : 'Ошибка загрузки';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _availableItemsError = 'Не удалось загрузить Ingredients/Semi-finished';
      });
    } finally {
      if (mounted) setState(() => _loadingAvailableItems = false);
    }
  }

  Future<List<Map<String, dynamic>>> _fetchFirstAvailableList(
    List<_FetchAttempt> attempts,
  ) async {
    DioException? lastError;
    var hasSuccess = false;
    for (final a in attempts) {
      try {
        final res = await _client.get(a.path);
        hasSuccess = true;
        final list = _extractDataList(res.data);
        if (list.isNotEmpty) return list;
      } on DioException catch (e) {
        lastError = e;
      }
    }
    if (hasSuccess) return const <Map<String, dynamic>>[];
    if (lastError != null) throw lastError;
    return const <Map<String, dynamic>>[];
  }

  _CalculationBuckets _parseCalculationBuckets(Map<String, dynamic> data) {
    final directIngredients =
        ((data['ingredient_calculations'] as List?) ?? const [])
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
    final directCompounds =
        ((data['compound_calculations'] as List?) ?? const [])
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
    if (directIngredients.isNotEmpty || directCompounds.isNotEmpty) {
      return _CalculationBuckets(
        ingredients: directIngredients,
        compounds: directCompounds,
      );
    }

    final mixed = (data['calculations'] as List?) ?? const [];
    final ingredients = <Map<String, dynamic>>[];
    final compounds = <Map<String, dynamic>>[];
    for (final rowAny in mixed.whereType<Map>()) {
      final row = Map<String, dynamic>.from(rowAny);
      final ingredientId = (row['ingredient_id'] ?? '').toString();
      final compoundId =
          (row['compound_id'] ?? row['component_compound_id'] ?? '').toString();
      if (ingredientId.isNotEmpty) {
        row['ingredient_id'] = ingredientId;
        ingredients.add(row);
        continue;
      }
      if (compoundId.isNotEmpty) {
        row['compound_id'] = compoundId;
        compounds.add(row);
      }
    }
    return _CalculationBuckets(ingredients: ingredients, compounds: compounds);
  }

  List<Map<String, dynamic>> _extractDataList(dynamic raw) {
    dynamic source = raw;
    if (raw is Map<String, dynamic>) {
      source = raw['data'] ?? raw['items'] ?? raw['results'] ?? const [];
    }
    if (source is Map<String, dynamic>) {
      source =
          source['items'] ?? source['results'] ?? source['data'] ?? const [];
    }
    if (source is List) {
      return source
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    return const <Map<String, dynamic>>[];
  }

  List<Map<String, dynamic>> get _filteredAvailableItems {
    final isIng = _activeTab == _AvailableItemsTab.ingredients;
    final source = isIng ? _availableIngredients : _availableCompounds;
    final kind = isIng ? 'ingredient' : 'compound';
    final combined = <Map<String, dynamic>>[
      for (final e in source) {...e, '__kind': kind},
    ];
    final q = _availableSearchQuery.trim().toLowerCase();
    if (q.isEmpty) return combined;
    return combined.where((e) {
      final name = (e['name'] ?? e['title'] ?? '').toString().toLowerCase();
      return name.contains(q);
    }).toList();
  }

  bool _isItemAdded(String id, {required bool isIngredient}) {
    if (id.isEmpty) return false;
    if (isIngredient) {
      return _ingredientCalculations.any(
        (e) => (e['ingredient_id'] ?? '').toString() == id,
      );
    }
    return _compoundCalculations.any(
      (e) => (e['compound_id'] ?? '').toString() == id,
    );
  }

  void _toggleAvailableItem(
    Map<String, dynamic> item, {
    required bool isIngredient,
  }) {
    final id = (item['id'] ?? '').toString();
    if (id.isEmpty) return;
    final unit = (item['unit'] ?? item['measurement'] ?? '').toString();
    setState(() {
      if (isIngredient) {
        final exists = _ingredientCalculations.any(
          (e) => (e['ingredient_id'] ?? '').toString() == id,
        );
        if (exists) {
          _disposeQtyCtrl(_qtyKey(id: id, isIngredient: true));
          _ingredientCalculations = _ingredientCalculations
              .where((e) => (e['ingredient_id'] ?? '').toString() != id)
              .toList();
        } else {
          _ingredientCalculations = [
            ..._ingredientCalculations,
            {
              'ingredient_id': id,
              'quantity': '1',
              if (unit.isNotEmpty) 'unit': unit,
            },
          ];
        }
      } else {
        final exists = _compoundCalculations.any(
          (e) => (e['compound_id'] ?? '').toString() == id,
        );
        if (exists) {
          _disposeQtyCtrl(_qtyKey(id: id, isIngredient: false));
          _compoundCalculations = _compoundCalculations
              .where((e) => (e['compound_id'] ?? '').toString() != id)
              .toList();
        } else {
          _compoundCalculations = [
            ..._compoundCalculations,
            {
              'compound_id': id,
              'quantity': '1',
              if (unit.isNotEmpty) 'unit': unit,
            },
          ];
        }
      }
    });
  }

  bool get _allFilteredAdded {
    final items = _filteredAvailableItems;
    if (items.isEmpty) return false;
    for (final item in items) {
      final id = (item['id'] ?? '').toString();
      final isIng = item['__kind'] == 'ingredient';
      if (!_isItemAdded(id, isIngredient: isIng)) return false;
    }
    return true;
  }

  void _toggleSelectAllFiltered() {
    final items = _filteredAvailableItems;
    if (items.isEmpty) return;
    final shouldRemoveAll = _allFilteredAdded;
    setState(() {
      for (final item in items) {
        final id = (item['id'] ?? '').toString();
        if (id.isEmpty) continue;
        final isIng = item['__kind'] == 'ingredient';
        final unit = (item['unit'] ?? item['measurement'] ?? '').toString();
        if (isIng) {
          final exists = _ingredientCalculations.any(
            (e) => (e['ingredient_id'] ?? '').toString() == id,
          );
          if (shouldRemoveAll && exists) {
            _disposeQtyCtrl(_qtyKey(id: id, isIngredient: true));
            _ingredientCalculations = _ingredientCalculations
                .where((e) => (e['ingredient_id'] ?? '').toString() != id)
                .toList();
          } else if (!shouldRemoveAll && !exists) {
            _ingredientCalculations = [
              ..._ingredientCalculations,
              {
                'ingredient_id': id,
                'quantity': '1',
                if (unit.isNotEmpty) 'unit': unit,
              },
            ];
          }
        } else {
          final exists = _compoundCalculations.any(
            (e) => (e['compound_id'] ?? '').toString() == id,
          );
          if (shouldRemoveAll && exists) {
            _disposeQtyCtrl(_qtyKey(id: id, isIngredient: false));
            _compoundCalculations = _compoundCalculations
                .where((e) => (e['compound_id'] ?? '').toString() != id)
                .toList();
          } else if (!shouldRemoveAll && !exists) {
            _compoundCalculations = [
              ..._compoundCalculations,
              {
                'compound_id': id,
                'quantity': '1',
                if (unit.isNotEmpty) 'unit': unit,
              },
            ];
          }
        }
      }
    });
  }

  Map<String, dynamic>? _findAvailableById({
    required String id,
    required bool ingredient,
  }) {
    final list = ingredient ? _availableIngredients : _availableCompounds;
    return list.firstWhereOrNull((e) => (e['id'] ?? '').toString() == id);
  }

  String _qtyKey({required String id, required bool isIngredient}) =>
      '${isIngredient ? 'ing' : 'cmp'}_$id';

  TextEditingController _qtyCtrlFor({
    required String key,
    required String initial,
  }) {
    final existing = _qtyCtrls[key];
    if (existing != null) return existing;
    final ctrl = TextEditingController(text: initial);
    _qtyCtrls[key] = ctrl;
    return ctrl;
  }

  void _disposeQtyCtrl(String key) {
    _qtyCtrls.remove(key)?.dispose();
  }

  void _updateRowQty({
    required String id,
    required String qty,
    required bool isIngredient,
  }) {
    if (isIngredient) {
      _ingredientCalculations = [
        for (final e in _ingredientCalculations)
          if ((e['ingredient_id'] ?? '').toString() == id)
            {...e, 'quantity': qty}
          else
            e,
      ];
    } else {
      _compoundCalculations = [
        for (final e in _compoundCalculations)
          if ((e['compound_id'] ?? '').toString() == id)
            {...e, 'quantity': qty}
          else
            e,
      ];
    }
    setState(() {});
  }

  double? _readPrice(Map<String, dynamic>? source) {
    if (source == null) return null;
    for (final key in const [
      'price',
      'cost_price',
      'unit_price',
      'purchase_price',
      'last_purchase_price',
      'last_price',
      'cost',
    ]) {
      final raw = source[key];
      if (raw == null) continue;
      final parsed = double.tryParse(raw.toString().replaceAll(',', '.'));
      if (parsed != null) return parsed;
    }
    return null;
  }

  double _computeTotalCost() {
    double total = 0;
    for (final row in _ingredientCalculations) {
      final id = (row['ingredient_id'] ?? '').toString();
      final source = _findAvailableById(id: id, ingredient: true);
      final priceNum = _readPrice(source) ?? _readPrice(row);
      final qtyNum = double.tryParse(
        (row['quantity'] ?? '').toString().replaceAll(',', '.'),
      );
      if (priceNum != null && qtyNum != null) total += priceNum * qtyNum;
    }
    for (final row in _compoundCalculations) {
      final id = (row['compound_id'] ?? '').toString();
      final source = _findAvailableById(id: id, ingredient: false);
      final priceNum = _readPrice(source) ?? _readPrice(row);
      final qtyNum = double.tryParse(
        (row['quantity'] ?? '').toString().replaceAll(',', '.'),
      );
      if (priceNum != null && qtyNum != null) total += priceNum * qtyNum;
    }
    return total;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _nameEnCtrl.dispose();
    _nameRuCtrl.dispose();
    _descriptionCtrl.dispose();
    _priceCtrl.dispose();
    _cookTimeCtrl.dispose();
    _pictureUrlCtrl.removeListener(_onPictureUrlChanged);
    _pictureUrlCtrl.dispose();
    _availableSearchCtrl.dispose();
    for (final c in _qtyCtrls.values) {
      c.dispose();
    }
    _qtyCtrls.clear();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserBloc b) => b.state.userMOdel?.role);
    final allowed = role.canManageMenu;
    final colors = context.colors;
    final canPop = Navigator.canPop(context);
    return AppScaffold(
      activeRoute: AppRoutes.menuManageScreen,
      body: Column(
        children: [
          MainHeader(
            title: _isEditMode ? S.current.strEditMeal : S.current.strNewMeal,
            leading: canPop
                ? IconButton(
                    icon: Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 18,
                      color: colors.textDefault,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(
                      minWidth: 36,
                      minHeight: 36,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  )
                : null,
          ),
          Expanded(
            child: Container(
              color: colors.bgSecondary,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(28, 24, 28, 24),
                child: allowed
                    ? (_isLoadingMeal
                          ? const Center(
                              child: CircularProgressIndicator.adaptive(),
                            )
                          : _formBody())
                    : Center(
                        child: Container(
                          width: 520,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: colors.bgSecondary,
                            border: Border.all(color: colors.border),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Доступ только для администратора, менеджера и суперадмина',
                            style: TextStyle(
                              fontSize: 14,
                              color: colors.textDefault,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _mealImagePanel(ThemeColors colors) {
    final ref = _pictureUrlCtrl.text.trim();
    final compact = ref.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (compact)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _MealImagePreview(pictureRef: ref),
          ),
        GestureDetector(
          onTap: _isSubmitting || _uploadingImage ? null : _pickAndUploadImage,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            height: compact ? 110 : 220,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  colors.textBrand.withOpacity(0.04),
                  colors.textBrand.withOpacity(0.10),
                ],
              ),
              border: Border.all(
                color: colors.textBrand.withOpacity(0.25),
                width: 1.2,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: _uploadingImage
                ? const Center(child: CircularProgressIndicator.adaptive())
                : Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: compact ? 40 : 56,
                          height: compact ? 40 : 56,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(
                              compact ? 12 : 16,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: colors.textBrand.withOpacity(0.12),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.cloud_upload_outlined,
                            color: colors.textBrand,
                            size: compact ? 20 : 26,
                          ),
                        ),
                        SizedBox(height: compact ? 8 : 14),
                        Text(
                          'Rasm yuklash',
                          style: TextStyle(
                            fontSize: compact ? 13 : 15,
                            fontWeight: FontWeight.w600,
                            color: colors.textDefault,
                            fontFamily: 'Inter',
                            letterSpacing: -0.1,
                          ),
                        ),
                        if (!compact) ...[
                          const SizedBox(height: 4),
                          Text(
                            'JPG · PNG · GIF · 5 MB gacha',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              color: colors.textSecondary,
                              fontFamily: 'Inter',
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _formBody() {
    final colors = context.colors;
    return ScrollConfiguration(
      behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
      child: SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_isEditMode) ...[
            Align(
              alignment: Alignment.centerRight,
              child: _HeaderDeleteButton(
                onTap: _isSubmitting ? null : _confirmDelete,
              ),
            ),
            const SizedBox(height: 14),
          ],
          // ── Basic info card ──
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 22, 24, 24),
            decoration: BoxDecoration(
              color: colors.bgDefault,
              border: Border.all(color: colors.border),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _SectionTitle('BASIC INFORMATION'),
                const SizedBox(height: 18),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                          _labeledInput('Name*', _nameCtrl),
                          const SizedBox(height: 16),
                          _labeledInput('Name (English)', _nameEnCtrl),
                          const SizedBox(height: 16),
                          _labeledInput('Name (Russian)', _nameRuCtrl),
                          const SizedBox(height: 16),
                          _labeledInput(
                            'Price*',
                            _priceCtrl,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            inputFormatters: [SumThousandsInputFormatter()],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        children: [
                          _labeledCategory(),
                          const SizedBox(height: 16),
                          _labeledInput(
                            'Cooking time (min)',
                            _cookTimeCtrl,
                            keyboardType: TextInputType.number,
                            numericKeyboard: true,
                          ),
                          const SizedBox(height: 16),
                          _labeledInput(
                            'Description',
                            _descriptionCtrl,
                            maxLines: 2,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    SizedBox(width: 240, child: _mealImagePanel(colors)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // ── Items (ingredients + compounds) card ──
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 10, 24, 12),
            decoration: BoxDecoration(
              color: colors.bgDefault,
              border: Border.all(color: colors.border),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Theme(
              data: Theme.of(
                context,
              ).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                iconColor: colors.textSecondary,
                collapsedIconColor: colors.textSecondary,
                onExpansionChanged: _onItemsExpansionChanged,
                title: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      const _SectionTitle('ITEMS'),
                      const SizedBox(width: 10),
                      if (_loadingItems)
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: colors.textTertiary,
                          ),
                        ),
                    ],
                  ),
                ),
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildItemsSectionContent(context.colors),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          // ── Footer action bar ──
          Row(
            children: [
              const Spacer(),
              _ActionBtn(
                label: S.current.strCancel,
                bg: colors.buttonSecondary,
                fg: colors.textButtonSecondary,
                onTap: _isSubmitting
                    ? null
                    : () {
                        if (Navigator.canPop(context)) {
                          Navigator.of(context).pop();
                        } else {
                          _clearForm();
                        }
                      },
              ),
              const SizedBox(width: 12),
              _ActionBtn(
                label: _isSubmitting
                    ? 'Saving...'
                    : (_isEditMode ? 'Update' : 'Save'),
                bg: _isSubmitting ? colors.buttonDisabledBg : colors.textBrand,
                fg: Colors.white,
                onTap: _isSubmitting
                    ? null
                    : () {
                        context.unfocusKeyboard();
                        _submit();
                      },
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
      ),
    );
  }

  Widget _buildItemsSectionContent(ThemeColors colors) {
    final editId = _editMealId;
    final waitingEditItems =
        _isEditMode &&
        editId != null &&
        editId.isNotEmpty &&
        !_itemsLoadedWithMeal &&
        _loadingItems &&
        _ingredientCalculations.isEmpty &&
        _compoundCalculations.isEmpty;

    if (waitingEditItems) {
      return SizedBox(
        height: 80,
        child: Center(
          child: CircularProgressIndicator.adaptive(
            valueColor: AlwaysStoppedAnimation<Color>(colors.textTertiary),
          ),
        ),
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(flex: 2, child: _availableItemsCard(colors)),
        const SizedBox(width: 16),
        Expanded(flex: 3, child: _addedItemsCard(colors)),
      ],
    );
  }

  Widget _availableItemsCard(ThemeColors colors) {
    return Container(
      decoration: BoxDecoration(
        color: colors.bgDefault,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            S.current.strAvailableItems,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: colors.textDefault,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: colors.bgSecondary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _segmentedTab(
                    colors: colors,
                    label: S.current.strIngredients,
                    selected: _activeTab == _AvailableItemsTab.ingredients,
                    onTap: () => setState(
                      () => _activeTab = _AvailableItemsTab.ingredients,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: _segmentedTab(
                    colors: colors,
                    label: S.current.strSemiFinished,
                    selected: _activeTab == _AvailableItemsTab.semiFinished,
                    onTap: () => setState(
                      () => _activeTab = _AvailableItemsTab.semiFinished,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          if (_availableItemsError != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: colors.bgDefault,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: colors.systemError.withOpacity(0.5),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      _availableItemsError!,
                      style: TextStyle(
                        fontSize: 13,
                        color: colors.systemError,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _loadingAvailableItems
                        ? null
                        : _fetchAvailableItemsFromApi,
                    child: Text(
                      'Reload',
                      style: TextStyle(fontSize: 13, color: colors.textBrand),
                    ),
                  ),
                ],
              ),
            ),
          Row(
            children: [
              _selectAllCheckbox(colors),
              const SizedBox(width: 12),
              Expanded(child: _searchField(colors)),
            ],
          ),
          const SizedBox(height: 12),
          _availableItemsList(colors),
        ],
      ),
    );
  }

  Widget _addedItemsCard(ThemeColors colors) {
    final hasIngredients = _ingredientCalculations.isNotEmpty;
    final hasCompounds = _compoundCalculations.isNotEmpty;
    final empty = !hasIngredients && !hasCompounds && !_loadingItems;
    final totalItems =
        _ingredientCalculations.length + _compoundCalculations.length;
    final totalCost = _computeTotalCost();
    final totalCostFormatted = AppFormatter.formatAmountWithSpaces(
      totalCost.toString(),
    );
    return Container(
      decoration: BoxDecoration(
        color: colors.bgDefault,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                S.current.strAddedItems,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: colors.textDefault,
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: _loadingItems
                    ? null
                    : () => _promptAddRow(
                        isIngredient:
                            _activeTab == _AvailableItemsTab.ingredients,
                      ),
                icon: Icon(Icons.add, size: 18, color: colors.textBrand),
                label: Text(
                  S.current.strManualAdd,
                  style: TextStyle(fontSize: 14, color: colors.textBrand),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (!empty) ...[
            _addedTableHeader(colors),
            const SizedBox(height: 6),
            Divider(height: 1, color: colors.border),
            const SizedBox(height: 6),
          ],
          if (hasIngredients)
            ...List.generate(_ingredientCalculations.length, (i) {
              return _calculationRow(
                colors,
                _ingredientCalculations[i],
                idLabel: 'ingredient_id',
                onRemove: () {
                  final id =
                      (_ingredientCalculations[i]['ingredient_id'] ?? '')
                          .toString();
                  _disposeQtyCtrl(_qtyKey(id: id, isIngredient: true));
                  setState(() {
                    _ingredientCalculations = List.of(_ingredientCalculations)
                      ..removeAt(i);
                  });
                },
              );
            }),
          if (hasCompounds)
            ...List.generate(_compoundCalculations.length, (i) {
              return _calculationRow(
                colors,
                _compoundCalculations[i],
                idLabel: 'compound_id',
                onRemove: () {
                  final id = (_compoundCalculations[i]['compound_id'] ?? '')
                      .toString();
                  _disposeQtyCtrl(_qtyKey(id: id, isIngredient: false));
                  setState(() {
                    _compoundCalculations = List.of(_compoundCalculations)
                      ..removeAt(i);
                  });
                },
              );
            }),
          if (empty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  S.current.strNoCalculationsHint,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: colors.textSecondary),
                ),
              ),
            ),
          if (!empty) ...[
            const SizedBox(height: 6),
            Divider(height: 1, color: colors.border),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  S.current.strItemsCount(totalItems),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: colors.textSecondary,
                  ),
                ),
                const Spacer(),
                Text(
                  '${S.current.strCost}: ',
                  style: TextStyle(
                    fontSize: 14,
                    color: colors.textSecondary,
                  ),
                ),
                Text(
                  totalCostFormatted,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: colors.textDefault,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _addedTableHeader(ThemeColors colors) {
    final style = TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          Expanded(flex: 5, child: Text(S.current.strName, style: style)),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Text(
              S.current.strQuantity,
              style: style,
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Text(
              S.current.strUnitPrice,
              style: style,
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Text(
              S.current.strTotalPrice,
              style: style,
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(width: 36),
        ],
      ),
    );
  }

  Widget _selectAllCheckbox(ThemeColors colors) {
    final items = _filteredAvailableItems;
    final enabled = items.isNotEmpty;
    final allAdded = enabled && _allFilteredAdded;
    return GestureDetector(
      onTap: enabled ? _toggleSelectAllFiltered : null,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: allAdded ? colors.textBrand : colors.bgDefault,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: allAdded ? colors.textBrand : colors.border,
            width: 1.5,
          ),
        ),
        child: allAdded
            ? const Icon(Icons.check_rounded, size: 18, color: Colors.white)
            : null,
      ),
    );
  }

  Widget _searchField(ThemeColors colors) {
    final hasText = _availableSearchQuery.isNotEmpty;
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: colors.bgSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasText ? colors.borderBrand : colors.border,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          const SizedBox(width: 14),
          Icon(
            Icons.search_rounded,
            size: 22,
            color: hasText ? colors.textBrand : colors.textTertiary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: _availableSearchCtrl,
              textInputAction: TextInputAction.search,
              style: TextStyle(
                fontSize: 15,
                color: colors.textDefault,
                height: 1.2,
              ),
              cursorColor: colors.textBrand,
              onChanged: (v) => setState(() => _availableSearchQuery = v),
              decoration: InputDecoration(
                hintText: S.current.strSearch,
                hintStyle: TextStyle(
                  fontSize: 15,
                  color: colors.textTertiary,
                  fontWeight: FontWeight.w400,
                ),
                border: InputBorder.none,
                isCollapsed: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          if (hasText)
            GestureDetector(
              onTap: () {
                _availableSearchCtrl.clear();
                setState(() => _availableSearchQuery = '');
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Icon(
                  Icons.close_rounded,
                  size: 20,
                  color: colors.textTertiary,
                ),
              ),
            )
          else
            const SizedBox(width: 14),
        ],
      ),
    );
  }

  Widget _availableItemsList(ThemeColors colors) {
    if (_loadingAvailableItems && _filteredAvailableItems.isEmpty) {
      return Container(
        height: 240,
        decoration: BoxDecoration(
          color: colors.bgDefault,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: colors.border),
        ),
        child: const Center(child: CircularProgressIndicator.adaptive()),
      );
    }
    final items = _filteredAvailableItems;
    if (items.isEmpty) {
      return Container(
        height: 240,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: colors.bgDefault,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: colors.border),
        ),
        child: Center(
          child: Text(
            'Available list bo\'sh',
            style: TextStyle(fontSize: 14, color: colors.textSecondary),
          ),
        ),
      );
    }
    return Container(
      constraints: const BoxConstraints(minHeight: 240, maxHeight: 480),
      decoration: BoxDecoration(
        color: colors.bgDefault,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: colors.border),
      ),
      child: ListView.separated(
        itemCount: items.length,
        separatorBuilder: (_, i) => Divider(height: 1, color: colors.border),
        itemBuilder: (_, i) {
          final item = items[i];
          final id = (item['id'] ?? '').toString();
          final name = (item['name'] ?? item['title'] ?? id).toString();
          final unit = (item['unit'] ?? item['measurement'] ?? '').toString();
          final isIng = item['__kind'] == 'ingredient';
          final added = _isItemAdded(id, isIngredient: isIng);
          return InkWell(
            onTap: () => _toggleAvailableItem(item, isIngredient: isIng),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: added ? colors.textBrand : colors.bgDefault,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: added ? colors.textBrand : colors.border,
                        width: 1.5,
                      ),
                    ),
                    child: added
                        ? const Icon(
                            Icons.check_rounded,
                            size: 18,
                            color: Colors.white,
                          )
                        : null,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: colors.textDefault,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          unit.isEmpty ? id : unit,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            color: colors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  _kindBadge(isIngredient: isIng),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _kindBadge({required bool isIngredient}) {
    final bg = isIngredient
        ? const Color(0xFFFDE4D2)
        : const Color(0xFFDCE6FF);
    final fg = isIngredient
        ? const Color(0xFFD15B1F)
        : const Color(0xFF3B5BDB);
    final label = isIngredient
        ? S.current.strIngredients
        : S.current.strSemiFinished;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }

  Widget _segmentedTab({
    required ThemeColors colors,
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        height: 42,
        decoration: BoxDecoration(
          color: selected ? colors.bgDefault : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 6,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              color: selected ? colors.textBrand : colors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _calculationRow(
    ThemeColors colors,
    Map<String, dynamic> row, {
    required String idLabel,
    required VoidCallback onRemove,
  }) {
    final ingredient = idLabel == 'ingredient_id';
    final id = (row[idLabel] ?? row['id'] ?? '').toString();
    final qty = (row['quantity'] ?? row['qty'] ?? '').toString();
    final source = _findAvailableById(id: id, ingredient: ingredient);
    final name = (row['name'] ?? source?['name'] ?? id).toString();
    final unit =
        (row['unit'] ?? source?['unit'] ?? source?['measurement'] ?? '')
            .toString();
    final priceNum = _readPrice(source) ?? _readPrice(row);
    final qtyNum = double.tryParse(qty.replaceAll(',', '.'));
    final totalRaw = (priceNum != null && qtyNum != null)
        ? (priceNum * qtyNum)
        : null;
    final priceFormatted = priceNum != null
        ? AppFormatter.formatAmountWithSpaces(priceNum.toString())
        : '0.00';
    final totalFormatted = totalRaw != null
        ? AppFormatter.formatAmountWithSpaces(totalRaw.toString())
        : '0.00';
    final qtyKey = _qtyKey(id: id, isIngredient: ingredient);
    final qtyCtrl = _qtyCtrlFor(key: qtyKey, initial: qty);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.bgDefault,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            flex: 5,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Flexible(
                  child: Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: colors.textDefault,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                _kindBadge(isIngredient: ingredient),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: _qtyInput(
              colors: colors,
              controller: qtyCtrl,
              unit: unit,
              onChanged: (v) => _updateRowQty(
                id: id,
                qty: v,
                isIngredient: ingredient,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Text(
              priceFormatted,
              textAlign: TextAlign.right,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                color: colors.textDefault,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Text(
              totalFormatted,
              textAlign: TextAlign.right,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: colors.textDefault,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: Icon(
              Icons.close_rounded,
              size: 22,
              color: colors.textSecondary,
            ),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            splashRadius: 20,
          ),
        ],
      ),
    );
  }

  Widget _qtyInput({
    required ThemeColors colors,
    required TextEditingController controller,
    required String unit,
    required ValueChanged<String> onChanged,
  }) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: colors.border),
    );
    return TextField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      textInputAction: TextInputAction.search,
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
      ],
      textAlign: TextAlign.center,
      textAlignVertical: TextAlignVertical.center,
      onChanged: onChanged,
      cursorColor: colors.textBrand,
      decoration: InputDecoration(
        filled: false,
        suffixText: unit.isNotEmpty ? unit : null,
        suffixStyle: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: colors.textTertiary,
        ),
        border: border,
        enabledBorder: border,
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colors.borderBrand, width: 1.2),
        ),
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 10,
          vertical: 12,
        ),
      ),
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: colors.textDefault,
      ),
    );
  }

  Future<void> _promptAddRow({required bool isIngredient}) async {
    final idCtrl = TextEditingController();
    final qtyCtrl = TextEditingController(text: '1');
    final idKey = isIngredient ? 'ingredient_id' : 'compound_id';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        final c = ctx.colors;
        return AlertDialog(
          backgroundColor: c.bgSecondary,
          title: Text(
            isIngredient ? 'Ингредиент' : 'Полуфабрикат',
            style: TextStyle(color: c.textDefault, fontSize: 16),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: idCtrl,
                style: TextStyle(color: c.textDefault, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'ID',
                  labelStyle: TextStyle(color: c.textTertiary),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: qtyCtrl,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                style: TextStyle(color: c.textDefault, fontSize: 13),
                decoration: InputDecoration(
                  labelText: S.current.strQuantity,
                  labelStyle: TextStyle(color: c.textTertiary),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(
                S.current.strCancel,
                style: TextStyle(color: c.textSecondary),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(
                S.current.strOK,
                style: TextStyle(color: c.textBrand),
              ),
            ),
          ],
        );
      },
    );
    if (ok != true || !mounted) return;
    final id = idCtrl.text.trim();
    if (id.isEmpty) return;
    final q = qtyCtrl.text.trim();
    setState(() {
      final map = <String, dynamic>{idKey: id, 'quantity': q};
      if (isIngredient) {
        _ingredientCalculations = [..._ingredientCalculations, map];
      } else {
        _compoundCalculations = [..._compoundCalculations, map];
      }
    });
  }

  Widget _labeledInput(
    String label,
    TextEditingController ctrl, {
    TextInputType? keyboardType,
    int maxLines = 1,
    List<TextInputFormatter>? inputFormatters,
    bool numericKeyboard = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _FieldLabel(label),
        const SizedBox(height: 8),
        _StyledInput(
          controller: ctrl,
          hint: '',
          keyboardType: keyboardType,
          maxLines: maxLines,
          inputFormatters: inputFormatters,
          numericKeyboard: numericKeyboard,
        ),
      ],
    );
  }

  Widget _labeledCategory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _FieldLabel('Category*'),
        const SizedBox(height: 8),
        _buildCategoryField(),
      ],
    );
  }

  Widget _buildCategoryField() {
    final colors = context.colors;
    if (_isLoadingCategories) {
      return Container(
        height: 40,
        decoration: BoxDecoration(
          color: colors.bgDefault,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colors.border),
        ),
        child: Center(
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: colors.textTertiary,
            ),
          ),
        ),
      );
    }

    if (_categories.isEmpty) {
      return Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: colors.bgDefault,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                _categoriesError ?? 'Категории не найдены',
                style: TextStyle(fontSize: 11, color: colors.systemError),
              ),
            ),
            GestureDetector(
              onTap: _loadCategories,
              child: Text(
                'Reload',
                style: TextStyle(fontSize: 11, color: colors.textBrand),
              ),
            ),
          ],
        ),
      );
    }

    return DropdownButtonFormField<CategoryModel>(
      value: _selectedCategory,
      borderRadius: BorderRadius.circular(14),
      items: _categories
          .map(
            (c) => DropdownMenuItem<CategoryModel>(
              value: c,
              child: Text(
                c.name,
                style: TextStyle(
                  fontSize: 15,
                  color: colors.textDefault,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'Inter',
                ),
              ),
            ),
          )
          .toList(),
      onChanged: (v) => setState(() => _selectedCategory = v),
      icon: Icon(
        Icons.keyboard_arrow_down_rounded,
        color: colors.textSecondary,
        size: 22,
      ),
      dropdownColor: colors.bgDefault,
      style: TextStyle(
        fontSize: 15,
        color: colors.textDefault,
        fontWeight: FontWeight.w500,
        fontFamily: 'Inter',
      ),
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 18,
        ),
        filled: true,
        fillColor: colors.bgDefault,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.borderBrand, width: 1.5),
        ),
      ),
    );
  }
}

class _FetchAttempt {
  final String path;

  const _FetchAttempt({required this.path});
}

class _CalculationBuckets {
  final List<Map<String, dynamic>> ingredients;
  final List<Map<String, dynamic>> compounds;

  const _CalculationBuckets({
    required this.ingredients,
    required this.compounds,
  });
}

class _SectionTitle extends StatelessWidget {
  final String text;

  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: context.colors.textTertiary,
        fontFamily: 'Inter',
        letterSpacing: 1.2,
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;

  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: context.colors.textDefault,
        fontFamily: 'Inter',
        letterSpacing: -0.1,
      ),
    );
  }
}


class _ActionBtn extends StatefulWidget {
  final String label;
  final Color bg;
  final Color fg;
  final VoidCallback? onTap;

  const _ActionBtn({
    required this.label,
    required this.bg,
    required this.fg,
    required this.onTap,
  });

  @override
  State<_ActionBtn> createState() => _ActionBtnState();
}

class _ActionBtnState extends State<_ActionBtn> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final disabled = widget.onTap == null;
    return MouseRegion(
      cursor: disabled ? MouseCursor.defer : SystemMouseCursors.click,
      child: GestureDetector(
        onTapDown: (_) {
          if (!disabled) setState(() => _pressed = true);
        },
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _pressed ? 0.97 : 1.0,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          child: Container(
            height: 56,
            padding: const EdgeInsets.symmetric(horizontal: 28),
            decoration: BoxDecoration(
              color: widget.bg,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(
                widget.label,
                style: TextStyle(
                  fontSize: 15,
                  color: widget.fg,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Inter',
                  letterSpacing: -0.1,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MealImagePreview extends StatelessWidget {
  final String pictureRef;

  const _MealImagePreview({required this.pictureRef});

  @override
  Widget build(BuildContext context) {
    final ref = pictureRef.trim();
    final colors = context.colors;
    if (ref.isEmpty) return const SizedBox.shrink();

    if (ref.startsWith('http://') || ref.startsWith('https://')) {
      return Container(
        height: 180,
        width: double.infinity,
        decoration: BoxDecoration(
          color: colors.bgSecondary,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: CachedNetworkImage(
          imageUrl: ref,
          fit: BoxFit.contain,
          placeholder: (context, url) => Center(
            child: CircularProgressIndicator.adaptive(
              valueColor: AlwaysStoppedAnimation<Color>(colors.textTertiary),
            ),
          ),
          errorWidget: (context, url, error) => _mealImageError(colors),
        ),
      );
    }

    return FutureBuilder<Uint8List?>(
      future: MinioService.instance.getImageByObjectName(ref),
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return SizedBox(
            height: 180,
            child: Center(
              child: CircularProgressIndicator.adaptive(
                valueColor: AlwaysStoppedAnimation<Color>(colors.textTertiary),
              ),
            ),
          );
        }
        final bytes = snap.data;
        if (bytes == null || bytes.isEmpty) {
          return _mealImageError(colors);
        }
        return Container(
          height: 180,
          width: double.infinity,
          decoration: BoxDecoration(
            color: colors.bgSecondary,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colors.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Image.memory(bytes, fit: BoxFit.contain),
        );
      },
    );
  }

  Widget _mealImageError(ThemeColors colors) {
    return Container(
      height: 180,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: colors.bgDefault,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Text(
        'Нет превью',
        style: TextStyle(fontSize: 11, color: colors.textSecondary),
      ),
    );
  }
}

class _StyledInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final int maxLines;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final bool numericKeyboard;

  const _StyledInput({
    required this.controller,
    required this.hint,
    this.maxLines = 1,
    this.keyboardType,
    this.inputFormatters,
    this.numericKeyboard = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      inputFormatters: inputFormatters,
      onTap: () =>
          GlobalVirtualKeyboard.open(controller, numeric: numericKeyboard),
      style: TextStyle(
        fontSize: 15,
        color: colors.textDefault,
        fontWeight: FontWeight.w500,
        fontFamily: 'Inter',
        letterSpacing: -0.1,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          fontSize: 15,
          color: colors.textTertiary,
          fontFamily: 'Inter',
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16,
          vertical: maxLines > 1 ? 14 : 18,
        ),
        filled: true,
        fillColor: colors.bgDefault,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.borderBrand, width: 1.5),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════
// Header delete button (top-right, destructive)
// ═══════════════════════════════════════════════════════

const Color _kDangerRed = Color(0xFFDC2626);
const Color _kDangerRedDark = Color(0xFFB91C1C);
const Color _kDangerRedSoft = Color(0xFFFEE2E2);

class _HeaderDeleteButton extends StatefulWidget {
  final VoidCallback? onTap;

  const _HeaderDeleteButton({required this.onTap});

  @override
  State<_HeaderDeleteButton> createState() => _HeaderDeleteButtonState();
}

class _HeaderDeleteButtonState extends State<_HeaderDeleteButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final disabled = widget.onTap == null;
    final fg = disabled ? _kDangerRed.withOpacity(0.5) : _kDangerRed;
    return MouseRegion(
      cursor: disabled ? SystemMouseCursors.basic : SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: _hovered && !disabled
                ? _kDangerRedSoft
                : _kDangerRedSoft.withOpacity(0.55),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: disabled
                  ? _kDangerRed.withOpacity(0.35)
                  : _kDangerRed.withOpacity(_hovered ? 0.85 : 0.6),
              width: 1.2,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.delete_outline_rounded,
                color: fg,
                size: 18,
              ),
              const SizedBox(width: 6),
              Text(
                S.current.strDelete,
                style: TextStyle(
                  color: fg,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                  letterSpacing: -0.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════
// Pretty delete-confirmation modal
// ═══════════════════════════════════════════════════════

class _DeleteMealDialog extends StatefulWidget {
  final String mealName;

  const _DeleteMealDialog({required this.mealName});

  @override
  State<_DeleteMealDialog> createState() => _DeleteMealDialogState();
}

class _DeleteMealDialogState extends State<_DeleteMealDialog> {
  bool _hoverCancel = false;
  bool _hoverConfirm = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final displayName = widget.mealName.isEmpty
        ? S.current.strDeleteMeal
        : widget.mealName;
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: Container(
          decoration: BoxDecoration(
            color: colors.bgDefault,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.25),
                blurRadius: 40,
                offset: const Offset(0, 16),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ── Hero banner ──
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(28, 28, 28, 24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      _kDangerRedSoft,
                      _kDangerRedSoft.withOpacity(0.55),
                    ],
                  ),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(24),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: _kDangerRed.withOpacity(0.18),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.delete_outline_rounded,
                        color: _kDangerRed,
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            S.current.strDeleteMeal,
                            style: const TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                              fontFamily: 'Inter',
                              letterSpacing: -0.3,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Bu amalni qaytarib bo'lmaydi.",
                            style: TextStyle(
                              fontSize: 13,
                              color: colors.textSecondary,
                              fontFamily: 'Inter',
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // ── Body ──
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 22, 28, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: TextStyle(
                          fontSize: 14.5,
                          color: colors.textDefault,
                          fontFamily: 'Inter',
                          height: 1.45,
                        ),
                        children: [
                          const TextSpan(
                            text:
                                'Quyidagi taomni butunlay o\'chirmoqchimisiz: ',
                          ),
                          TextSpan(
                            text: '"$displayName"',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: _kDangerRed,
                            ),
                          ),
                          const TextSpan(text: '?'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _kDangerRedSoft.withOpacity(0.45),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _kDangerRed.withOpacity(0.18),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.info_outline_rounded,
                            color: _kDangerRed,
                            size: 18,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              "Taomning barcha ingredientlari va sozlamalari ham o'chiriladi.",
                              style: TextStyle(
                                fontSize: 12.5,
                                color: colors.textDefault,
                                fontFamily: 'Inter',
                                height: 1.35,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // ── Actions ──
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 18, 28, 24),
                child: Row(
                  children: [
                    Expanded(
                      child: _DialogActionBtn(
                        label: S.current.strCancel,
                        onTap: () => Navigator.pop(context, false),
                        bg: colors.bgSecondary,
                        fg: colors.textDefault,
                        borderColor: colors.border,
                        hovered: _hoverCancel,
                        onHover: (v) => setState(() => _hoverCancel = v),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: _DialogActionBtn(
                        label: S.current.strDelete,
                        icon: Icons.delete_outline_rounded,
                        onTap: () => Navigator.pop(context, true),
                        bg: _hoverConfirm ? _kDangerRedDark : _kDangerRed,
                        fg: Colors.white,
                        hovered: _hoverConfirm,
                        onHover: (v) => setState(() => _hoverConfirm = v),
                        elevated: true,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DialogActionBtn extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;
  final Color bg;
  final Color fg;
  final Color? borderColor;
  final bool hovered;
  final ValueChanged<bool> onHover;
  final bool elevated;

  const _DialogActionBtn({
    required this.label,
    required this.onTap,
    required this.bg,
    required this.fg,
    required this.hovered,
    required this.onHover,
    this.icon,
    this.borderColor,
    this.elevated = false,
  });

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => onHover(true),
      onExit: (_) => onHover(false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(12),
            border: borderColor != null
                ? Border.all(color: borderColor!)
                : null,
            boxShadow: elevated
                ? [
                    BoxShadow(
                      color: _kDangerRed.withOpacity(hovered ? 0.35 : 0.22),
                      blurRadius: hovered ? 16 : 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, color: fg, size: 18),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: TextStyle(
                  color: fg,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  letterSpacing: -0.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
