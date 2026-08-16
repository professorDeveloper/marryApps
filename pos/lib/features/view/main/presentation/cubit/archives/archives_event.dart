part of 'archives_bloc.dart';

@freezed
class ArchivesEvent with _$ArchivesEvent {
  const factory ArchivesEvent.started() = _Started;
  const factory ArchivesEvent.getArchived() = _GetArchived;
  const factory ArchivesEvent.statusChanged(Status status) = _StatusChanged;
  const factory ArchivesEvent.archivesUpdated(ArchivesResponseEntity archives) =
      _ArchivesUpdated;
  const factory ArchivesEvent.failureChanged(Failure? failure) =
      _FailureChanged;
  const factory ArchivesEvent.searchChanged(String value) = _SearchChanged;
  const factory ArchivesEvent.searchByArchiveNum(String value) =
      _SearchByArchiveNum;
  const factory ArchivesEvent.selectArchive({required String id}) =
      _SelectArchive;
  const factory ArchivesEvent.getArchiveDetail() = _GetArchiveDetail;
  const factory ArchivesEvent.updateFilterType({
    required ArchivesFilterType type,
  }) = _UpdateFilterType;
  const factory ArchivesEvent.updateFilterDateRange({
    required DateTime startDate,
    required DateTime endDate,
  }) = _UpdateFilterDateRange;
}
