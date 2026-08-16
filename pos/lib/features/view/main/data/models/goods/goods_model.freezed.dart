// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'goods_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

GoodsModel _$GoodsModelFromJson(Map<String, dynamic> json) {
  return _GoodsModel.fromJson(json);
}

/// @nodoc
mixin _$GoodsModel {
  @JsonKey(name: 'category_id')
  String get categoryId => throw _privateConstructorUsedError;
  @JsonKey(name: 'color_code')
  String? get colorCode => throw _privateConstructorUsedError;
  @JsonKey(name: 'cook_time')
  int get cookTime => throw _privateConstructorUsedError;
  @JsonKey(name: 'cost_price')
  String get costPrice => throw _privateConstructorUsedError;
  @JsonKey(name: 'department_id')
  String get departmentId => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  @JsonKey(name: 'description_i18n')
  String? get descriptionI18n => throw _privateConstructorUsedError;
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  @JsonKey(name: 'name_i18n')
  String? get nameI18n => throw _privateConstructorUsedError;
  @JsonKey(name: 'picture_url')
  String? get pictureUrl => throw _privateConstructorUsedError;
  String get price => throw _privateConstructorUsedError;
  String get profit => throw _privateConstructorUsedError;
  @JsonKey(name: 'profit_margin')
  String get profitMargin => throw _privateConstructorUsedError;
  @JsonKey(includeFromJson: false, includeToJson: false)
  List<FoodAdditionalModel> get additionals =>
      throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $GoodsModelCopyWith<GoodsModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GoodsModelCopyWith<$Res> {
  factory $GoodsModelCopyWith(
          GoodsModel value, $Res Function(GoodsModel) then) =
      _$GoodsModelCopyWithImpl<$Res, GoodsModel>;
  @useResult
  $Res call(
      {@JsonKey(name: 'category_id') String categoryId,
      @JsonKey(name: 'color_code') String? colorCode,
      @JsonKey(name: 'cook_time') int cookTime,
      @JsonKey(name: 'cost_price') String costPrice,
      @JsonKey(name: 'department_id') String departmentId,
      String description,
      @JsonKey(name: 'description_i18n') String? descriptionI18n,
      String id,
      String name,
      @JsonKey(name: 'name_i18n') String? nameI18n,
      @JsonKey(name: 'picture_url') String? pictureUrl,
      String price,
      String profit,
      @JsonKey(name: 'profit_margin') String profitMargin,
      @JsonKey(includeFromJson: false, includeToJson: false)
      List<FoodAdditionalModel> additionals});
}

/// @nodoc
class _$GoodsModelCopyWithImpl<$Res, $Val extends GoodsModel>
    implements $GoodsModelCopyWith<$Res> {
  _$GoodsModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? categoryId = null,
    Object? colorCode = freezed,
    Object? cookTime = null,
    Object? costPrice = null,
    Object? departmentId = null,
    Object? description = null,
    Object? descriptionI18n = freezed,
    Object? id = null,
    Object? name = null,
    Object? nameI18n = freezed,
    Object? pictureUrl = freezed,
    Object? price = null,
    Object? profit = null,
    Object? profitMargin = null,
    Object? additionals = null,
  }) {
    return _then(_value.copyWith(
      categoryId: null == categoryId
          ? _value.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as String,
      colorCode: freezed == colorCode
          ? _value.colorCode
          : colorCode // ignore: cast_nullable_to_non_nullable
              as String?,
      cookTime: null == cookTime
          ? _value.cookTime
          : cookTime // ignore: cast_nullable_to_non_nullable
              as int,
      costPrice: null == costPrice
          ? _value.costPrice
          : costPrice // ignore: cast_nullable_to_non_nullable
              as String,
      departmentId: null == departmentId
          ? _value.departmentId
          : departmentId // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      descriptionI18n: freezed == descriptionI18n
          ? _value.descriptionI18n
          : descriptionI18n // ignore: cast_nullable_to_non_nullable
              as String?,
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      nameI18n: freezed == nameI18n
          ? _value.nameI18n
          : nameI18n // ignore: cast_nullable_to_non_nullable
              as String?,
      pictureUrl: freezed == pictureUrl
          ? _value.pictureUrl
          : pictureUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      price: null == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as String,
      profit: null == profit
          ? _value.profit
          : profit // ignore: cast_nullable_to_non_nullable
              as String,
      profitMargin: null == profitMargin
          ? _value.profitMargin
          : profitMargin // ignore: cast_nullable_to_non_nullable
              as String,
      additionals: null == additionals
          ? _value.additionals
          : additionals // ignore: cast_nullable_to_non_nullable
              as List<FoodAdditionalModel>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GoodsModelImplCopyWith<$Res>
    implements $GoodsModelCopyWith<$Res> {
  factory _$$GoodsModelImplCopyWith(
          _$GoodsModelImpl value, $Res Function(_$GoodsModelImpl) then) =
      __$$GoodsModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'category_id') String categoryId,
      @JsonKey(name: 'color_code') String? colorCode,
      @JsonKey(name: 'cook_time') int cookTime,
      @JsonKey(name: 'cost_price') String costPrice,
      @JsonKey(name: 'department_id') String departmentId,
      String description,
      @JsonKey(name: 'description_i18n') String? descriptionI18n,
      String id,
      String name,
      @JsonKey(name: 'name_i18n') String? nameI18n,
      @JsonKey(name: 'picture_url') String? pictureUrl,
      String price,
      String profit,
      @JsonKey(name: 'profit_margin') String profitMargin,
      @JsonKey(includeFromJson: false, includeToJson: false)
      List<FoodAdditionalModel> additionals});
}

/// @nodoc
class __$$GoodsModelImplCopyWithImpl<$Res>
    extends _$GoodsModelCopyWithImpl<$Res, _$GoodsModelImpl>
    implements _$$GoodsModelImplCopyWith<$Res> {
  __$$GoodsModelImplCopyWithImpl(
      _$GoodsModelImpl _value, $Res Function(_$GoodsModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? categoryId = null,
    Object? colorCode = freezed,
    Object? cookTime = null,
    Object? costPrice = null,
    Object? departmentId = null,
    Object? description = null,
    Object? descriptionI18n = freezed,
    Object? id = null,
    Object? name = null,
    Object? nameI18n = freezed,
    Object? pictureUrl = freezed,
    Object? price = null,
    Object? profit = null,
    Object? profitMargin = null,
    Object? additionals = null,
  }) {
    return _then(_$GoodsModelImpl(
      categoryId: null == categoryId
          ? _value.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as String,
      colorCode: freezed == colorCode
          ? _value.colorCode
          : colorCode // ignore: cast_nullable_to_non_nullable
              as String?,
      cookTime: null == cookTime
          ? _value.cookTime
          : cookTime // ignore: cast_nullable_to_non_nullable
              as int,
      costPrice: null == costPrice
          ? _value.costPrice
          : costPrice // ignore: cast_nullable_to_non_nullable
              as String,
      departmentId: null == departmentId
          ? _value.departmentId
          : departmentId // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      descriptionI18n: freezed == descriptionI18n
          ? _value.descriptionI18n
          : descriptionI18n // ignore: cast_nullable_to_non_nullable
              as String?,
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      nameI18n: freezed == nameI18n
          ? _value.nameI18n
          : nameI18n // ignore: cast_nullable_to_non_nullable
              as String?,
      pictureUrl: freezed == pictureUrl
          ? _value.pictureUrl
          : pictureUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      price: null == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as String,
      profit: null == profit
          ? _value.profit
          : profit // ignore: cast_nullable_to_non_nullable
              as String,
      profitMargin: null == profitMargin
          ? _value.profitMargin
          : profitMargin // ignore: cast_nullable_to_non_nullable
              as String,
      additionals: null == additionals
          ? _value._additionals
          : additionals // ignore: cast_nullable_to_non_nullable
              as List<FoodAdditionalModel>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GoodsModelImpl extends _GoodsModel {
  const _$GoodsModelImpl(
      {@JsonKey(name: 'category_id') required this.categoryId,
      @JsonKey(name: 'color_code') this.colorCode,
      @JsonKey(name: 'cook_time') required this.cookTime,
      @JsonKey(name: 'cost_price') required this.costPrice,
      @JsonKey(name: 'department_id') this.departmentId = '',
      required this.description,
      @JsonKey(name: 'description_i18n') this.descriptionI18n,
      required this.id,
      required this.name,
      @JsonKey(name: 'name_i18n') this.nameI18n,
      @JsonKey(name: 'picture_url') this.pictureUrl,
      required this.price,
      required this.profit,
      @JsonKey(name: 'profit_margin') required this.profitMargin,
      @JsonKey(includeFromJson: false, includeToJson: false)
      final List<FoodAdditionalModel> additionals = const []})
      : _additionals = additionals,
        super._();

  factory _$GoodsModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$GoodsModelImplFromJson(json);

  @override
  @JsonKey(name: 'category_id')
  final String categoryId;
  @override
  @JsonKey(name: 'color_code')
  final String? colorCode;
  @override
  @JsonKey(name: 'cook_time')
  final int cookTime;
  @override
  @JsonKey(name: 'cost_price')
  final String costPrice;
  @override
  @JsonKey(name: 'department_id')
  final String departmentId;
  @override
  final String description;
  @override
  @JsonKey(name: 'description_i18n')
  final String? descriptionI18n;
  @override
  final String id;
  @override
  final String name;
  @override
  @JsonKey(name: 'name_i18n')
  final String? nameI18n;
  @override
  @JsonKey(name: 'picture_url')
  final String? pictureUrl;
  @override
  final String price;
  @override
  final String profit;
  @override
  @JsonKey(name: 'profit_margin')
  final String profitMargin;
  final List<FoodAdditionalModel> _additionals;
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  List<FoodAdditionalModel> get additionals {
    if (_additionals is EqualUnmodifiableListView) return _additionals;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_additionals);
  }

  @override
  String toString() {
    return 'GoodsModel(categoryId: $categoryId, colorCode: $colorCode, cookTime: $cookTime, costPrice: $costPrice, departmentId: $departmentId, description: $description, descriptionI18n: $descriptionI18n, id: $id, name: $name, nameI18n: $nameI18n, pictureUrl: $pictureUrl, price: $price, profit: $profit, profitMargin: $profitMargin, additionals: $additionals)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GoodsModelImpl &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            (identical(other.colorCode, colorCode) ||
                other.colorCode == colorCode) &&
            (identical(other.cookTime, cookTime) ||
                other.cookTime == cookTime) &&
            (identical(other.costPrice, costPrice) ||
                other.costPrice == costPrice) &&
            (identical(other.departmentId, departmentId) ||
                other.departmentId == departmentId) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.descriptionI18n, descriptionI18n) ||
                other.descriptionI18n == descriptionI18n) &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.nameI18n, nameI18n) ||
                other.nameI18n == nameI18n) &&
            (identical(other.pictureUrl, pictureUrl) ||
                other.pictureUrl == pictureUrl) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.profit, profit) || other.profit == profit) &&
            (identical(other.profitMargin, profitMargin) ||
                other.profitMargin == profitMargin) &&
            const DeepCollectionEquality()
                .equals(other._additionals, _additionals));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      categoryId,
      colorCode,
      cookTime,
      costPrice,
      departmentId,
      description,
      descriptionI18n,
      id,
      name,
      nameI18n,
      pictureUrl,
      price,
      profit,
      profitMargin,
      const DeepCollectionEquality().hash(_additionals));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$GoodsModelImplCopyWith<_$GoodsModelImpl> get copyWith =>
      __$$GoodsModelImplCopyWithImpl<_$GoodsModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GoodsModelImplToJson(
      this,
    );
  }
}

abstract class _GoodsModel extends GoodsModel {
  const factory _GoodsModel(
      {@JsonKey(name: 'category_id') required final String categoryId,
      @JsonKey(name: 'color_code') final String? colorCode,
      @JsonKey(name: 'cook_time') required final int cookTime,
      @JsonKey(name: 'cost_price') required final String costPrice,
      @JsonKey(name: 'department_id') final String departmentId,
      required final String description,
      @JsonKey(name: 'description_i18n') final String? descriptionI18n,
      required final String id,
      required final String name,
      @JsonKey(name: 'name_i18n') final String? nameI18n,
      @JsonKey(name: 'picture_url') final String? pictureUrl,
      required final String price,
      required final String profit,
      @JsonKey(name: 'profit_margin') required final String profitMargin,
      @JsonKey(includeFromJson: false, includeToJson: false)
      final List<FoodAdditionalModel> additionals}) = _$GoodsModelImpl;
  const _GoodsModel._() : super._();

  factory _GoodsModel.fromJson(Map<String, dynamic> json) =
      _$GoodsModelImpl.fromJson;

  @override
  @JsonKey(name: 'category_id')
  String get categoryId;
  @override
  @JsonKey(name: 'color_code')
  String? get colorCode;
  @override
  @JsonKey(name: 'cook_time')
  int get cookTime;
  @override
  @JsonKey(name: 'cost_price')
  String get costPrice;
  @override
  @JsonKey(name: 'department_id')
  String get departmentId;
  @override
  String get description;
  @override
  @JsonKey(name: 'description_i18n')
  String? get descriptionI18n;
  @override
  String get id;
  @override
  String get name;
  @override
  @JsonKey(name: 'name_i18n')
  String? get nameI18n;
  @override
  @JsonKey(name: 'picture_url')
  String? get pictureUrl;
  @override
  String get price;
  @override
  String get profit;
  @override
  @JsonKey(name: 'profit_margin')
  String get profitMargin;
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  List<FoodAdditionalModel> get additionals;
  @override
  @JsonKey(ignore: true)
  _$$GoodsModelImplCopyWith<_$GoodsModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
