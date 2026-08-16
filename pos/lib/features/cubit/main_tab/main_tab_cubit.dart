import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
part 'main_tab_state.dart';
part 'main_tab_cubit.freezed.dart';

class MainTabCubit extends Cubit<MainTabState> {
  MainTabCubit() : super(const MainTabState());

  Future<void> isMainTab(int currentIndex) async {
    emit(state.copyWith(main: currentIndex));
  }
}
