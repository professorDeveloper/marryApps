import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/common/custom_network_image.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/features/view/main/data/models/category/category_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class MenuPanel extends StatefulWidget {
  const MenuPanel({super.key});

  @override
  State<MenuPanel> createState() => _MenuPanelState();
}

class _MenuPanelState extends State<MenuPanel> {
  // null = categories view, non-null = foods view
  CategoryModel? _selectedCategory;
  final TextEditingController _searchCtrl = TextEditingController();
  String _lastSearch = '';

  @override
  void initState() {
    super.initState();
    // Virtual keyboard controller.value ni dasturiy o'zgartiradi — onChanged
    // bunday o'zgarishlarni tutmaydi. Shuning uchun controller listener.
    _searchCtrl.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final current = _searchCtrl.text;
    if (current == _lastSearch) return;
    _lastSearch = current;
    if (!mounted) return;
    context.read<DetailBloc>().add(
      DetailEvent.searchTextChanged(text: current),
    );
  }

  @override
  void dispose() {
    _searchCtrl.removeListener(_onSearchChanged);
    _searchCtrl.dispose();
    super.dispose();
  }

  void _selectCategory(CategoryModel cat) {
    setState(() => _selectedCategory = cat);
    context.read<DetailBloc>().add(
          DetailEvent.setSelectedCategoryId(id: cat.id),
        );
  }

  void _goHome() {
    setState(() => _selectedCategory = null);
    _searchCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Column(
      children: [
        _TopBar(
          inFoodsView: _selectedCategory != null,
          categoryName: _selectedCategory?.name,
          searchCtrl: _searchCtrl,
          onBack: _goHome,
          onHome: _goHome,
        ),
        Divider(height: 1, color: colors.border),
        Expanded(
          child: _selectedCategory == null
              ? _CategoriesView(onSelect: _selectCategory)
              : _FoodsView(category: _selectedCategory!),
        ),
      ],
    );
  }
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final bool inFoodsView;
  final String? categoryName;
  final TextEditingController searchCtrl;
  final VoidCallback onBack;
  final VoidCallback onHome;

  const _TopBar({
    required this.inFoodsView,
    required this.categoryName,
    required this.searchCtrl,
    required this.onBack,
    required this.onHome,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      height: 56,
      color: colors.bgDefault,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          _NavBtn(
            icon: Icons.chevron_left_rounded,
            enabled: inFoodsView,
            onTap: onBack,
          ),
          const SizedBox(width: 4),
          _NavBtn(
            icon: Icons.chevron_right_rounded,
            enabled: false,
            onTap: () {},
          ),
          const SizedBox(width: 4),
          _NavBtn(
            icon: Icons.home_outlined,
            enabled: inFoodsView,
            onTap: onHome,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: SizedBox(
              height: 36,
              child: TextField(
                controller: searchCtrl,
                // onChanged virtual keyboard bilan ishlamaydi —
                // parent `_MenuPanelState` controller listener'ga ulangan.
                style: TextStyle(
                  fontSize: 13,
                  color: colors.textDefault,
                ),
                decoration: InputDecoration(
                  hintText: S.current.strSearch,
                  hintStyle: TextStyle(
                    fontSize: 13,
                    color: colors.textSecondary,
                  ),
                  suffixIcon: Icon(
                    Icons.search,
                    size: 18,
                    color: colors.textSecondary,
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
                  filled: true,
                  fillColor: colors.bgSecondary,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _NavBtn({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: colors.bgSecondary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 20,
          color: enabled ? colors.iconDefault : colors.emptyValueColor,
        ),
      ),
    );
  }
}

// ─── Categories grid view ─────────────────────────────────────────────────────

class _CategoriesView extends StatelessWidget {
  final ValueChanged<CategoryModel> onSelect;

  const _CategoriesView({required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      color: colors.bgSecondary,
      child: BlocBuilder<DetailBloc, DetailState>(
        buildWhen: (p, c) =>
            p.categories != c.categories || p.status != c.status,
        builder: (context, state) {
          if (state.status == Status.OTHER_LOADING &&
              state.categories == null) {
            return const Center(child: CircularProgressIndicator.adaptive());
          }

          final categories = (state.categories ?? [])
              .where((c) => c.id != 'all')
              .toList();

          if (categories.isEmpty) {
            return Center(
              child: Text(
                'Kategoriyalar topilmadi',
                style: TextStyle(
                  fontSize: 14,
                  color: colors.textSecondary,
                ),
              ),
            );
          }

          return LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 400;
              final pad = compact ? 8.0 : 12.0;
              return ListView(
                padding: EdgeInsets.all(pad),
                children: [
                  const _SectionHeader('Меню'),
                  SizedBox(height: compact ? 8 : 10),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: compact ? 2 : 3,
                      crossAxisSpacing: compact ? 6 : 8,
                      mainAxisSpacing: compact ? 6 : 8,
                      childAspectRatio: 1.05,
                    ),
                    itemCount: categories.length,
                    itemBuilder: (context, index) => _CategoryCard(
                      category: categories[index],
                      onTap: () => onSelect(categories[index]),
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(title, style: context.textStyles.semibold16);
  }
}

class _CategoryCard extends StatefulWidget {
  final CategoryModel category;
  final VoidCallback onTap;

  const _CategoryCard({required this.category, required this.onTap});

  @override
  State<_CategoryCard> createState() => _CategoryCardState();
}

class _CategoryCardState extends State<_CategoryCard> {
  bool _hovered = false;

  Color get _cardColor {
    if (widget.category.colorCode != null &&
        widget.category.colorCode!.isNotEmpty) {
      final hex = widget.category.colorCode!.replaceAll('#', '');
      final val = int.tryParse(
        hex.length == 6 ? 'FF$hex' : hex,
        radix: 16,
      );
      if (val != null) return Color(val);
    }
    return const Color(0xFFFB6633);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          decoration: BoxDecoration(
            color: _hovered ? colors.buttonBrandSecondary : colors.bgDefault,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _hovered ? colors.borderBrand : colors.border,
            ),
          ),
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: _cardColor.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: widget.category.pictureUrl != null
                    ? ClipOval(
                        child: CustomCachedNetworkImage(
                          minioObjectName: widget.category.pictureUrl,
                          width: 30,
                          height: 30,
                          fit: BoxFit.cover,
                        ),
                      )
                    : Center(
                        child: Text(
                          widget.category.name.isNotEmpty
                              ? widget.category.name[0].toUpperCase()
                              : '?',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: _cardColor,
                          ),
                        ),
                      ),
              ),
              const Spacer(),
              Text(
                widget.category.name,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: colors.textDefault,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'блюда',
                      style: TextStyle(
                        fontSize: 10,
                        color: colors.textSecondary,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    size: 12,
                    color: colors.textSecondary,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Foods grid view ──────────────────────────────────────────────────────────

class _FoodsView extends StatelessWidget {
  final CategoryModel category;

  const _FoodsView({required this.category});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      color: colors.bgSecondary,
      child: BlocBuilder<DetailBloc, DetailState>(
        buildWhen: (p, c) => p.goods != c.goods || p.status != c.status,
        builder: (context, state) {
          if (state.status == Status.LOADING) {
            return const Center(child: CircularProgressIndicator.adaptive());
          }

          final products = state.goods ?? [];

          if (products.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.restaurant_menu,
                    size: 40,
                    color: colors.emptyValueColor,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${category.name} bo\'sh',
                    style: TextStyle(
                      fontSize: 14,
                      color: colors.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          return LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 400;
              final pad = compact ? 8.0 : 12.0;
              return ListView(
                padding: EdgeInsets.all(pad),
                children: [
                  _SectionHeader(category.name),
                  SizedBox(height: compact ? 8 : 10),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: compact ? 2 : 3,
                      crossAxisSpacing: compact ? 6 : 8,
                      mainAxisSpacing: compact ? 6 : 8,
                      childAspectRatio: 0.82,
                    ),
                    itemCount: products.length,
                    itemBuilder: (context, index) =>
                        _FoodCard(product: products[index]),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}

class _FoodCard extends StatefulWidget {
  final GoodsModel product;
  const _FoodCard({required this.product});

  @override
  State<_FoodCard> createState() => _FoodCardState();
}

class _FoodCardState extends State<_FoodCard> {
  bool _hovered = false;

  Color get _statusColor {
    if (widget.product.colorCode != null &&
        widget.product.colorCode!.isNotEmpty) {
      final hex = widget.product.colorCode!.replaceAll('#', '');
      final val = int.tryParse(
        hex.length == 6 ? 'FF$hex' : hex,
        radix: 16,
      );
      if (val != null) return Color(val);
    }
    return const Color(0xFFFB6633);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () => context.read<DetailBloc>().add(
              DetailEvent.selectGood(good: widget.product),
            ),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          decoration: BoxDecoration(
            color: _hovered ? colors.buttonBrand : colors.bgDefault,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _hovered ? colors.buttonBrand : colors.border,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(13)),
                  child: Container(
                    width: double.infinity,
                    color: _hovered
                        ? colors.buttonBrand.withOpacity(0.8)
                        : colors.buttonSecondary,
                    child: widget.product.pictureUrl == null
                        ? Container(
                            decoration: BoxDecoration(
                              border: Border(
                                left: BorderSide(
                                    width: 4, color: _statusColor),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                widget.product.name.isNotEmpty
                                    ? widget.product.name[0].toUpperCase()
                                    : '?',
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w700,
                                  color: _hovered
                                      ? colors.textOnBrand.withOpacity(0.54)
                                      : colors.textSecondary,
                                ),
                              ),
                            ),
                          )
                        : CustomCachedNetworkImage(
                            height: double.infinity,
                            width: double.infinity,
                            minioObjectName: widget.product.pictureUrl,
                            fit: BoxFit.cover,
                          ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.product.name,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _hovered
                            ? colors.textOnBrand
                            : colors.textDefault,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      num.parse(widget.product.price).formatN,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: _hovered
                            ? colors.systemInfo
                            : colors.textBrand,
                      ),
                    ),
                    if (widget.product.cookTime > 0) ...[
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            size: 11,
                            color: _hovered
                                ? colors.textOnBrand.withOpacity(0.54)
                                : colors.textSecondary,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            '${widget.product.cookTime}',
                            style: TextStyle(
                              fontSize: 11,
                              color: _hovered
                                  ? colors.textOnBrand.withOpacity(0.54)
                                  : colors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
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
