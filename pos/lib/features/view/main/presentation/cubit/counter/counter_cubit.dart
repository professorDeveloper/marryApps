import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'counter_state.dart';
part 'counter_cubit.freezed.dart';

class CounterCubit extends Cubit<CounterState> {
  CounterCubit() : super(const CounterState());

  void increment() {
    emit(state.copyWith(count: state.count + 1));
  }

  void decremet() {
    if (state.count > 0) {
      emit(state.copyWith(count: state.count - 1));
    }
  }

  void started(int? startCount) {
    emit(CounterState(count: startCount ?? 1));
  }
}
