part of 'archives_bloc.dart';

@freezed
class ArchivesState with _$ArchivesState {
  const factory ArchivesState({
    @Default(Status.UNKNOWN) Status status,
    @Default(Status.UNKNOWN) Status archiveStatus,
    @Default(ArchivesFilterType.Today) ArchivesFilterType filterType,
    @Default([
      ArchivesFilterType.All,
      ArchivesFilterType.Today,
      ArchivesFilterType.Week,
      ArchivesFilterType.month,
    ])
    List<ArchivesFilterType> filters,
    DateTime? startFilterDate,
    DateTime? endFilterDate,
    TextEditingController? textController,
    ArchivesResponseEntity? archives,
    ArchiveDetailEntity? selectArchiveDetail,
    ArchiveEntity? selectArchive,
    Failure? failure,
  }) = _ArchivesState;

  factory ArchivesState.initial() {
    return ArchivesState(textController: TextEditingController());
  }
}
