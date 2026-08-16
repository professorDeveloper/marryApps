part of 'archive_bloc.dart';

@freezed
class ArchiveEvent with _$ArchiveEvent {
  const factory ArchiveEvent.started() = _Started;
  const factory ArchiveEvent.getArchive({String? id}) = _GetArchive;
}
