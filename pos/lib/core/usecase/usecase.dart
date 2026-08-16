import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:dartz/dartz.dart';

abstract class UseCase<T, Params> {
  Future<Either<Failure, T>> call(Params params);
}

/// Class to handle when useCase don't need params
class NoParams {}

abstract class StreamUseCase<T, Params> {
  Stream<Type> call(Params params);
}
