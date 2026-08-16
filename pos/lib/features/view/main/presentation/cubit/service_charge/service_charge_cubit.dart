import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';

class ServiceChargeState {
  final double? value;
  final bool loading;
  final bool saving;
  final String? error;

  const ServiceChargeState({
    this.value,
    this.loading = false,
    this.saving = false,
    this.error,
  });

  ServiceChargeState copyWith({
    Object? value = _sentinel,
    bool? loading,
    bool? saving,
    Object? error = _sentinel,
  }) {
    return ServiceChargeState(
      value: identical(value, _sentinel) ? this.value : value as double?,
      loading: loading ?? this.loading,
      saving: saving ?? this.saving,
      error: identical(error, _sentinel) ? this.error : error as String?,
    );
  }

  static const _sentinel = Object();
}

class ServiceChargeCubit extends Cubit<ServiceChargeState> {
  final DioClient _dio;
  ServiceChargeCubit(this._dio) : super(const ServiceChargeState());

  Future<void> load(String branchId) async {
    if (branchId.isEmpty) return;
    emit(state.copyWith(loading: true, error: null));
    try {
      final res = await _dio.get(ListAPI.branchById(branchId));
      final data = res.data;
      final body = (data is Map && data['data'] is Map)
          ? data['data'] as Map
          : (data as Map);
      final raw = body['default_service_percent'];
      double parsed = 0;
      if (raw is num) {
        parsed = raw.toDouble();
      } else if (raw is String) {
        parsed = double.tryParse(raw) ?? 0;
      }
      emit(state.copyWith(value: parsed, loading: false));
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<bool> save(String branchId, double value) async {
    if (branchId.isEmpty) return false;
    emit(state.copyWith(saving: true, error: null));
    try {
      final asString = value == value.truncateToDouble()
          ? value.toStringAsFixed(0)
          : value.toString();
      await _dio.put(
        ListAPI.branchById(branchId),
        data: {'default_service_percent': asString},
      );
      emit(state.copyWith(value: value, saving: false));
      return true;
    } catch (e) {
      emit(state.copyWith(saving: false, error: e.toString()));
      return false;
    }
  }
}
