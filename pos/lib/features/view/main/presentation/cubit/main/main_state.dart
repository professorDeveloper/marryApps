part of 'main_cubit.dart';

@freezed
class MainState with _$MainState {
  const factory MainState({
    List<CafeTableModel>? tables,
    List<HallModel>? halls,
    @Default(false) bool isLoading,
    String? selectedHallId,
    @Default(UnknownFailure()) Failure failure,
    @Default(Status.UNKNOWN) Status status,
  }) = _MainState;
}
