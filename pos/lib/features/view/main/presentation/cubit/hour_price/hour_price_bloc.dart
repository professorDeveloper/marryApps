import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/hour_price_response_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_hour_price_usecase.dart';

part 'hour_price_event.dart';
part 'hour_price_state.dart';
part 'hour_price_bloc.freezed.dart';

class HourPriceBloc extends Bloc<HourPriceEvent, HourPriceState> {
  late final GetHourPriceUsecase _getHourPriceUsecase;
  HourPriceBloc({required GetHourPriceUsecase getHourPriceUsecase})
    : _getHourPriceUsecase = getHourPriceUsecase,
      super(const HourPriceState()) {
    on<_Started>(_started);
    on<_GetPrice>(_getPrice);
  }

  void _started(_Started event, emit) {
    emit(HourPriceState(orderId: event.orderId));
    add(const _GetPrice());
  }

  void _getPrice(_GetPrice event, emit) async {
    if (state.orderId != null) {
      emit(state.copyWith(status: Status.LOADING));
      final response = await _getHourPriceUsecase.call(state.orderId!);
      response.fold(
        (l) => emit(state.copyWith(status: Status.ERROR)),
        (r) => emit(state.copyWith(status: Status.SUCCESS, price: r)),
      );
    }
  }
}
