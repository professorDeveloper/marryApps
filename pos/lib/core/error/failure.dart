import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

abstract class LocalizedMessage {
  String getLocalizedMessage(BuildContext context);
}

abstract class Failure extends Equatable implements LocalizedMessage {
  const Failure();

  @override
  List<Object> get props => [];
}

class EmptyFailure extends Failure {
  const EmptyFailure() : super();

  @override
  String getLocalizedMessage(BuildContext context) => '';
}

class MessageFailure extends Failure {
  final String message;
  const MessageFailure(this.message) : super();

  @override
  String getLocalizedMessage(BuildContext context) => message;
}

class CacheFailure extends Failure {
  const CacheFailure() : super();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_cache;
}

class UnknownFailure extends Failure {
  const UnknownFailure() : super();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_unknown;
}

class ServerFailure extends Failure {
  const ServerFailure() : super();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_server;
}

class ConnectionFailure extends Failure {
  const ConnectionFailure() : super();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_connection;
}

class ParsingFailure extends Failure {
  const ParsingFailure();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_parsing;
}

class TimeoutFailure extends Failure {
  const TimeoutFailure();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_timeout;
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_unauthorized;
}

class UnauthenticatedFailure extends Failure {
  const UnauthenticatedFailure();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_unauthenticated;
}

class NotFoundFailure extends Failure {
  const NotFoundFailure();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_notFound;
}

class ValidationFailure extends Failure {
  const ValidationFailure();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_validation;
}

class OtherFailure extends Failure {
  const OtherFailure();

  @override
  String getLocalizedMessage(BuildContext context) =>
      S.of(context).strFailureMessage_other;
}

extension ShowErrorExt on Failure {
  void showErrorMsg() {
    showErrorMessage(
      navigatorKey.currentContext!,
      getLocalizedMessage(navigatorKey.currentContext!),
    );
  }
}
