import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/error/failure.dart';

part 'notification_event.dart';
part 'notification_state.dart';
part 'notification_bloc.freezed.dart';

class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  NotificationBloc() : super(NotificationState.initial()) {
    on<_Started>(_onStarted);
    on<_UpdateFilterType>(_onUpdateFilterType);
    on<_UpdateDateFilterEvent>(_onUpdateDateFilterEvent);
    on<_GetNotifications>(_onGetNotifications);
    on<_AgainNotifications>(_onAgainNotifications);
  }

  void _onStarted(_Started event, Emitter<NotificationState> emit) {
    emit(
      state.copyWith(
        scrollController: state.scrollController ?? ScrollController(),
        searchController: state.searchController ?? TextEditingController(),
        failure: null,
      ),
    );
    add(const NotificationEvent.getNotifications());
  }

  void _onUpdateFilterType(
    _UpdateFilterType event,
    Emitter<NotificationState> emit,
  ) {
    if (state.filterType == event.filterType) return;

    emit(state.copyWith(filterType: event.filterType, failure: null));
    add(const NotificationEvent.getNotifications());
  }

  void _onUpdateDateFilterEvent(
    _UpdateDateFilterEvent event,
    Emitter<NotificationState> emit,
  ) {
    emit(
      state.copyWith(
        start: event.start,
        end: event.end,
        filterType: ArchivesFilterType.date,
      ),
    );
  }

  Future<void> _onGetNotifications(
    _GetNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    emit(state.copyWith(status: Status.LOADING, failure: null));
    await Future<void>.delayed(Duration.zero);
    emit(state.copyWith(status: Status.SUCCESS));
  }

  void _onAgainNotifications(
    _AgainNotifications event,
    Emitter<NotificationState> emit,
  ) {
    add(const NotificationEvent.getNotifications());
  }

  @override
  Future<void> close() {
    state.scrollController?.dispose();
    state.searchController?.dispose();
    return super.close();
  }
}
