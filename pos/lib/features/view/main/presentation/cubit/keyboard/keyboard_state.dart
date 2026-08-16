class KeyboardState {
  final bool open;

  const KeyboardState({this.open = false});

  KeyboardState copyWith({bool? open}) {
    return KeyboardState(open: open ?? this.open);
  }
}
