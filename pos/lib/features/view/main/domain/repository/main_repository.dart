import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/service/printer/printer_setting_entry.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';
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

abstract class MainRepository {
  Future<Either<Failure, List<CafeTableModel>>> getTablesByHallId(
    String hallId,
  );

  Future<Either<Failure, ShiftResponseModel>> openShift({
    required OpenShiftModel request,
  });

  Future<Either<Failure, bool>> closeShift({
    required CloseShiftRequestModel request,
  });

  Future<Either<Failure, ShiftResponseModel?>> checkShift({required String id});

  Future<Either<Failure, List<HallModel>>> getHalls();
  Future<Either<Failure, bool>> createOrder({
    required CreateOrderRequestModel request,
  });

  Future<Either<Failure, UserModel>> getUser();

  Future<Either<Failure, List<UserModel>>> getUsers();

  Future<Either<Failure, String>> createTakewayOrder({
    required CreateOrderRequestModel request,
  });

  Future<Either<Failure, HourPriceResponseEntity>> getHourPrice({
    required String orderId,
  });

  Future<Either<Failure, List<CategoryModel>>> getCategories();
  Future<Either<Failure, List<GoodsModel>>> getGoodsByCategoryId(
    String categoryId,
  );
  Future<Either<Failure, List<GoodsModel>>> getGoodsWithName(String name);
  Future<Either<Failure, ArchivesResponseEntity>> getArchives(
    ArchivesFilterRequestEntity request,
  );
  Future<Either<Failure, ArchiveDetailEntity>> getArchiveWithId(String id);
  Future<Either<Failure, ArchiveDetailEntity>> getPaymentDetailWithTableId(
    String id,
  );
  Future<Either<Failure, ArchiveDetailEntity>> getPaymentDetailWithId(
    String id,
  );
  Future<Either<Failure, bool>> createPayment({
    required PaymentPayRequestEntity request,
  });

  Future<Either<Failure, List<PrinterSettingEntry>>> getPrinterSettings();
}
