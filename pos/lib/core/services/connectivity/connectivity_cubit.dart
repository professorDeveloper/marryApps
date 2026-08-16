import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConnectivityCubit extends Cubit<bool> {
  final Connectivity _connectivity;
  StreamSubscription<List<ConnectivityResult>>? _sub;

  ConnectivityCubit(this._connectivity) : super(true) {
    _init();
  }

  Future<void> _init() async {
    final results = await _connectivity.checkConnectivity();
    emit(_isOnline(results));
    _sub = _connectivity.onConnectivityChanged.listen((results) {
      emit(_isOnline(results));
    });
  }

  bool get isOnline => state;

  bool _isOnline(List<ConnectivityResult> results) => results.any(
        (r) =>
            r == ConnectivityResult.wifi ||
            r == ConnectivityResult.ethernet ||
            r == ConnectivityResult.mobile ||
            r == ConnectivityResult.vpn ||
            r == ConnectivityResult.other,
      );

  @override
  Future<void> close() {
    _sub?.cancel();
    return super.close();
  }
}
