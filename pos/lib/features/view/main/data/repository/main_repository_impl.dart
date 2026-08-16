import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/service/printer/printer_setting_entry.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';
import 'package:mary_ai_pos/features/view/main/data/data_source/main_datasources.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/category/category_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/close_shift/close_shift_request_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/create_order/create_order_request_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_shift/open_shift_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/shift/shift_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_filter_request_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_response_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/hour_price_response_entity.dart';

import 'package:mary_ai_pos/features/view/main/domain/entities/payment_pay_request_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class MainRepositoryImpl implements MainRepository {
  final MainDataSources _dataSources;

  MainRepositoryImpl(this._dataSources);

  @override
  Future<Either<Failure, HourPriceResponseEntity>> getHourPrice({
    required String orderId,
  }) async => await _dataSources.getHourPrice(orderId: orderId);

  @override
  Future<Either<Failure, bool>> closeShift({
    required CloseShiftRequestModel request,
  }) async {
    return await _dataSources.closeShift(request: request);
  }

  @override
  Future<Either<Failure, ShiftResponseModel>> openShift({
    required OpenShiftModel request,
  }) async {
    return await _dataSources.openShift(request: request);
  }

  @override
  Future<Either<Failure, ShiftResponseModel?>> checkShift({
    required String id,
  }) async => await _dataSources.checkShift(id: id);

  @override
  Future<Either<Failure, UserModel>> getUser() async =>
      await _dataSources.getUser();

  @override
  Future<Either<Failure, List<UserModel>>> getUsers() async =>
      await _dataSources.getUsers();

  @override
  Future<Either<Failure, ArchiveDetailEntity>> getPaymentDetailWithId(
    String id,
  ) async => await _dataSources.getPaymentDetailWithId(id);

  @override
  Future<Either<Failure, List<CafeTableModel>>> getTablesByHallId(
    String hallId,
  ) {
    return _dataSources.getTablesByHallId(hallId);
  }

  @override
  Future<Either<Failure, String>> createTakewayOrder({
    required CreateOrderRequestModel request,
  }) async => await _dataSources.createTakewayOrder(request: request);

  @override
  Future<Either<Failure, bool>> createOrder({
    required CreateOrderRequestModel request,
  }) async => await _dataSources.createOrder(request: request);

  @override
  Future<Either<Failure, List<HallModel>>> getHalls() {
    return _dataSources.getHalls();
  }

  @override
  Future<Either<Failure, List<CategoryModel>>> getCategories() {
    return _dataSources.getCategories();
  }

  @override
  Future<Either<Failure, List<GoodsModel>>> getGoodsByCategoryId(
    String categoryId,
  ) {
    return _dataSources.getGoodsByCategoryId(categoryId);
  }

  @override
  Future<Either<Failure, List<GoodsModel>>> getGoodsWithName(String name) {
    return _dataSources.getGoodsWithName(name);
  }

  @override
  Future<Either<Failure, ArchivesResponseEntity>> getArchives(
    ArchivesFilterRequestEntity request,
  ) {
    return _dataSources.getArchives(request);
  }

  @override
  Future<Either<Failure, ArchiveDetailEntity>> getArchiveWithId(String id) {
    return _dataSources.getArchiveWithId(id);
  }

  @override
  Future<Either<Failure, ArchiveDetailEntity>> getPaymentDetailWithTableId(
    String id,
  ) {
    return _dataSources.getPaymentDetailWithTableId(id);
  }

  @override
  Future<Either<Failure, bool>> createPayment({
    required PaymentPayRequestEntity request,
  }) async => await _dataSources.createPayment(request: request);

  @override
  Future<Either<Failure, List<PrinterSettingEntry>>> getPrinterSettings() =>
      _dataSources.getPrinterSettings();
}
