import 'package:bloc/bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/features/view/main/data/models/archives_filter_request/archives_filter_request_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/pagination_request/pagination_request_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_response_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_archive_with_id_usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_archives_usecase.dart';
import 'package:rxdart/rxdart.dart';

part 'archives_event.dart';
part 'archives_state.dart';
part 'archives_bloc.freezed.dart';

class ArchivesBloc extends Bloc<ArchivesEvent, ArchivesState> {
  late final GetArchivesUsecase _getArchivesUsecase;
  late final GetArchiveWithIdUsecase _getArchiveWithIdUsecase;
  //
  ArchivesBloc({
    required GetArchivesUsecase getArchivesUsecase,
    required GetArchiveWithIdUsecase getArchiveWithIdUsecase,
  }) : _getArchivesUsecase = getArchivesUsecase,
       _getArchiveWithIdUsecase = getArchiveWithIdUsecase,
       super(ArchivesState.initial()) {
    on<_Started>(_onStarted);
    on<_StatusChanged>(_onStatusChanged);
    on<_ArchivesUpdated>(_onArchivesUpdated);
    on<_FailureChanged>(_onFailureChanged);
    on<_SearchChanged>(_onSearchChanged);
    on<_GetArchived>(_getArchived);
    on<_SelectArchive>(_selectArchive);
    on<_GetArchiveDetail>(_getArchiveDetail);
    on<_UpdateFilterType>(_updateFilterType);
    on<_UpdateFilterDateRange>(_updateFilterDateRange);
    on<_SearchByArchiveNum>(
      _onSearchByArchiveNum,
      transformer: (events, mapper) => events
          .debounceTime(const Duration(milliseconds: 600))
          .switchMap(mapper),
    );
  }

  void _updateFilterType(_UpdateFilterType event, emit) {
    if (state.filterType != event.type) {
      emit(
        state.copyWith(
          filterType: event.type,
          archives: null,
          startFilterDate: null,
          endFilterDate: null,
        ),
      );
      add(const _GetArchived());
    }
  }

  void _updateFilterDateRange(_UpdateFilterDateRange event, emit) {
    emit(
      state.copyWith(
        filterType: ArchivesFilterType.date,
        startFilterDate: event.startDate,
        endFilterDate: event.endDate,
        archives: null,
      ),
    );
    add(const _GetArchived());
  }

  Future<void> _getArchiveDetail(
    _GetArchiveDetail event,
    Emitter<ArchivesState> emit,
  ) async {
    if (state.selectArchive != null) {
      emit(
        state.copyWith(
          archiveStatus: Status.LOADING,
          selectArchiveDetail: null,
        ),
      );
      final response = await _getArchiveWithIdUsecase.call(
        state.selectArchive!.id,
      );
      if (isClosed) return;
      response.fold(
        (l) {
          if (isClosed) return;
          showErrorMessage(
            navigatorKey.currentContext!,
            l.getLocalizedMessage(navigatorKey.currentContext!),
          );
        },
        (r) {
          if (isClosed) return;
          emit(
            state.copyWith(
              archiveStatus: Status.SUCCESS,
              selectArchiveDetail: r,
            ),
          );
        },
      );
    }
  }

  void _selectArchive(_SelectArchive event, emit) {
    if (state.archives != null &&
        state.archives!.archives.indexWhere((v) => v.id == event.id) != -1) {
      emit(
        state.copyWith(
          selectArchive:
              state.archives!.archives[state.archives!.archives.indexWhere(
                (v) => v.id == event.id,
              )],
        ),
      );
      add(const _GetArchiveDetail());
    }
  }

  Future<void> _getArchived(
    _GetArchived event,
    Emitter<ArchivesState> emit,
  ) async {
    emit(state.copyWith(status: Status.LOADING));
    final response = await _getArchivesUsecase.call(
      ArchivesFilterRequestModel(
        archiveNum: int.tryParse(state.textController?.text ?? ""),
        filterType: state.filterType,
        startDate: state.startFilterDate,
        endDate: state.endFilterDate,
        pagination: PaginationRequestModel.calculate(
          items: state.archives?.archives.length ?? 0,
          limit: 20,
        ),
      ),
    );
    if (isClosed) return;
    response.fold(
      (l) {
        if (isClosed) return;
        showErrorMessage(
          navigatorKey.currentContext!,
          l.getLocalizedMessage(navigatorKey.currentContext!),
        );
        emit(state.copyWith(status: Status.ERROR, failure: l));
      },
      (r) {
        if (isClosed) return;
        emit(
          state.copyWith(
            archives: r,
            status: Status.SUCCESS,
            failure: null,
          ),
        );
        if (r.archives.isNotEmpty && state.selectArchive == null) {
          if (!isClosed) {
            add(_SelectArchive(id: r.archives[0].id));
          }
        }
      },
    );
  }

  void _onStarted(_Started event, Emitter<ArchivesState> emit) {
    emit(
      state.copyWith(textController: TextEditingController(), failure: null),
    );
    add(const _GetArchived());
  }

  void _onStatusChanged(_StatusChanged event, Emitter<ArchivesState> emit) {
    emit(state.copyWith(status: event.status));
  }

  void _onArchivesUpdated(_ArchivesUpdated event, Emitter<ArchivesState> emit) {
    emit(state.copyWith(archives: event.archives, failure: null));
  }

  void _onFailureChanged(_FailureChanged event, Emitter<ArchivesState> emit) {
    emit(state.copyWith(failure: event.failure));
  }

  void _onSearchChanged(_SearchChanged event, Emitter<ArchivesState> emit) {
    final controller = state.textController ?? TextEditingController();
    if (controller.text != event.value) {
      controller.value = controller.value.copyWith(
        text: event.value,
        selection: TextSelection.collapsed(offset: event.value.length),
      );
    }
    emit(state.copyWith(textController: controller));
  }

  void _onSearchByArchiveNum(
    _SearchByArchiveNum event,
    Emitter<ArchivesState> emit,
  ) {
    add(_SearchChanged(event.value));
    add(const _GetArchived());
  }

  @override
  Future<void> close() {
    state.textController?.dispose();
    return super.close();
  }
}
