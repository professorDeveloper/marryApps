part of 'orders_bloc.dart';

@freezed
class SavedOrdersState with _$SavedOrdersState {
  const factory SavedOrdersState({@Default([]) List<SaveOrderEntity> order}) =
      _SavedOrdersState;
}
