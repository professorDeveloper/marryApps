import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/keyboard/keyboard_state.dart';

class KeyboardCubit extends Cubit<KeyboardState> {
  KeyboardCubit() : super(const KeyboardState());

  void update(bool value) {
    emit(state.copyWith(open: value));
  }
}
