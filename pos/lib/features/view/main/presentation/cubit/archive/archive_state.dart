part of 'archive_bloc.dart';

@freezed
class ArchiveState with _$ArchiveState {
  const factory ArchiveState({
    @Default(Status.UNKNOWN) Status status,
    ArchiveDetailEntity? archiveDetail,
    Failure? failure,
  }) = _ArchiveState;
}
