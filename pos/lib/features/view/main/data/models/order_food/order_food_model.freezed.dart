// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'order_food_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

OrderFoodModel _$OrderFoodModelFromJson(Map<String, dynamic> json) {
  return _OrderFoodModel.fromJson(json);
}

/// @nodoc
mixin _$OrderFoodModel {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: "good_name")
  String get name => throw _privateConstructorUsedError;
  int get quantity => throw _privateConstructorUsedError;
  @JsonKey(fromJson: parseInt)
  int get price => throw _privateConstructorUsedError;
  String get comment => throw _privateConstructorUsedError;
  String get status =>
      throw _privateConstructorUsedError; // Backend `created_at` (UTC) — har bir item qachon buyurtmaga qo'shilgan.
// Agar mavjud bo'lsa, UI vaqt belgisi sifatida ko'rsatadi.
  @JsonKey(name: 'created_at', fromJson: _parseLocalDate)
  DateTime? get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $OrderFoodModelCopyWith<OrderFoodModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OrderFoodModelCopyWith<$Res> {
  factory $OrderFoodModelCopyWith(
          OrderFoodModel value, $Res Function(OrderFoodModel) then) =
      _$OrderFoodModelCopyWithImpl<$Res, OrderFoodModel>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: "good_name") String name,
      int quantity,
      @JsonKey(fromJson: parseInt) int price,
      String comment,
      String status,
      @JsonKey(name: 'created_at', fromJson: _parseLocalDate)
      DateTime? createdAt});
}

/// @nodoc
class _$OrderFoodModelCopyWithImpl<$Res, $Val extends OrderFoodModel>
    implements $OrderFoodModelCopyWith<$Res> {
  _$OrderFoodModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? quantity = null,
    Object? price = null,
    Object? comment = null,
    Object? status = null,
    Object? createdAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      price: null == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as int,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$OrderFoodModelImplCopyWith<$Res>
    implements $OrderFoodModelCopyWith<$Res> {
  factory _$$OrderFoodModelImplCopyWith(_$OrderFoodModelImpl value,
          $Res Function(_$OrderFoodModelImpl) then) =
      __$$OrderFoodModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: "good_name") String name,
      int quantity,
      @JsonKey(fromJson: parseInt) int price,
      String comment,
      String status,
      @JsonKey(name: 'created_at', fromJson: _parseLocalDate)
      DateTime? createdAt});
}

/// @nodoc
class __$$OrderFoodModelImplCopyWithImpl<$Res>
    extends _$OrderFoodModelCopyWithImpl<$Res, _$OrderFoodModelImpl>
    implements _$$OrderFoodModelImplCopyWith<$Res> {
  __$$OrderFoodModelImplCopyWithImpl(
      _$OrderFoodModelImpl _value, $Res Function(_$OrderFoodModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? quantity = null,
    Object? price = null,
    Object? comment = null,
    Object? status = null,
    Object? createdAt = freezed,
  }) {
    return _then(_$OrderFoodModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      price: null == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as int,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$OrderFoodModelImpl extends _OrderFoodModel {
  const _$OrderFoodModelImpl(
      {this.id = '',
      @JsonKey(name: "good_name") this.name = '',
      this.quantity = 0,
      @JsonKey(fromJson: parseInt) this.price = 0,
      this.comment = '',
      this.status = 'pending',
      @JsonKey(name: 'created_at', fromJson: _parseLocalDate) this.createdAt})
      : super._();

  factory _$OrderFoodModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$OrderFoodModelImplFromJson(json);

  @override
  @JsonKey()
  final String id;
  @override
  @JsonKey(name: "good_name")
  final String name;
  @override
  @JsonKey()
  final int quantity;
  @override
  @JsonKey(fromJson: parseInt)
  final int price;
  @override
  @JsonKey()
  final String comment;
  @override
  @JsonKey()
  final String status;
// Backend `created_at` (UTC) — har bir item qachon buyurtmaga qo'shilgan.
// Agar mavjud bo'lsa, UI vaqt belgisi sifatida ko'rsatadi.
  @override
  @JsonKey(name: 'created_at', fromJson: _parseLocalDate)
  final DateTime? createdAt;

  @override
  String toString() {
    return 'OrderFoodModel(id: $id, name: $name, quantity: $quantity, price: $price, comment: $comment, status: $status, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OrderFoodModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.comment, comment) || other.comment == comment) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, name, quantity, price, comment, status, createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$OrderFoodModelImplCopyWith<_$OrderFoodModelImpl> get copyWith =>
      __$$OrderFoodModelImplCopyWithImpl<_$OrderFoodModelImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$OrderFoodModelImplToJson(
      this,
    );
  }
}

abstract class _OrderFoodModel extends OrderFoodModel {
  const factory _OrderFoodModel(
      {final String id,
      @JsonKey(name: "good_name") final String name,
      final int quantity,
      @JsonKey(fromJson: parseInt) final int price,
      final String comment,
      final String status,
      @JsonKey(name: 'created_at', fromJson: _parseLocalDate)
      final DateTime? createdAt}) = _$OrderFoodModelImpl;
  const _OrderFoodModel._() : super._();

  factory _OrderFoodModel.fromJson(Map<String, dynamic> json) =
      _$OrderFoodModelImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: "good_name")
  String get name;
  @override
  int get quantity;
  @override
  @JsonKey(fromJson: parseInt)
  int get price;
  @override
  String get comment;
  @override
  String get status;
  @override // Backend `created_at` (UTC) — har bir item qachon buyurtmaga qo'shilgan.
// Agar mavjud bo'lsa, UI vaqt belgisi sifatida ko'rsatadi.
  @JsonKey(name: 'created_at', fromJson: _parseLocalDate)
  DateTime? get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$OrderFoodModelImplCopyWith<_$OrderFoodModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
