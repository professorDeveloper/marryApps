import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/dio_exception_handler.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/core/service/printer/printer_setting_entry.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/archive_detail/archive_detail_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/archives_response/archives_response_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/category/category_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/close_shift/close_shift_request_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/create_order/create_order_request_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hour_price/hour_price_response_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_shift/open_shift_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/shift/shift_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_filter_request_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_response_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/hour_price_response_entity.dart';

import 'package:mary_ai_pos/features/view/main/domain/entities/payment_pay_request_entity.dart';

abstract class MainDataSources {
  Future<Either<Failure, List<CafeTableModel>>> getTablesByHallId(
    String hallId,
  );
  Future<Either<Failure, List<HallModel>>> getHalls();
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

  Future<Either<Failure, bool>> createOrder({
    required CreateOrderRequestModel request,
  });

  Future<Either<Failure, String>> createTakewayOrder({
    required CreateOrderRequestModel request,
  });

  Future<String> getOrderIdWithTableId({required String tableId});

  Future<Either<Failure, UserModel>> getUser();

  Future<Either<Failure, List<UserModel>>> getUsers();

  Future<Either<Failure, ShiftResponseModel?>> checkShift({required String id});

  Future<Either<Failure, ShiftResponseModel>> openShift({
    required OpenShiftModel request,
  });

  Future<Either<Failure, bool>> closeShift({
    required CloseShiftRequestModel request,
  });

  Future<Either<Failure, HourPriceResponseEntity>> getHourPrice({
    required String orderId,
  });

  Future<Either<Failure, List<PrinterSettingEntry>>> getPrinterSettings();
}

class MainDataSourcesImpl implements MainDataSources {
  final DioClient _client;

  MainDataSourcesImpl(this._client);

  @override
  Future<Either<Failure, List<PrinterSettingEntry>>> getPrinterSettings() async {
    try {
      final response = await _client.get(ListAPI.printerSettings);
      final root = response.data;
      List<dynamic>? dataList;
      if (root is Map<String, dynamic>) {
        final data = root['data'];
        if (data is List) dataList = data;
      } else if (root is List) {
        dataList = root;
      }
      if (dataList == null) {
        return const Left(ParsingFailure());
      }
      return Right(PrinterSettingEntry.listFromJsonList(dataList));
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, HourPriceResponseEntity>> getHourPrice({
    required String orderId,
  }) async {
    try {
      final getOrderId = await getOrderIdWithTableId(tableId: orderId);
      final response = await _client.get(ListAPI.orderHourPrice(getOrderId));
      return Right(HourPriceResponseModel.fromJson(response.data['data']));
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on String catch (e) {
      return Left(MessageFailure(e));
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, bool>> closeShift({
    required CloseShiftRequestModel request,
  }) async {
    try {
      // shiftId is in the URL path only; body must not include it
      await _client.post(
        ListAPI.closeShift(request.shiftId),
        data: {
          'closing_cash': request.closingCash.toString(),
          'closing_card': request.closingCard.toString(),
        },
      );
      return const Right(true);
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on String catch (e) {
      return Left(MessageFailure(e));
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, ShiftResponseModel>> openShift({
    required OpenShiftModel request,
  }) async {
    try {
      // README: cashier_id is taken from JWT token — do NOT send it
      final response = await _client.post(
        ListAPI.openShift,
        data: {
          'cash_register_id': request.cashRegisterId,
          'opening_cash': request.openCashSum.toString(),
          'opening_card': request.openCardSum.toString(),
        },
      );
      return Right(ShiftResponseModel.fromJson(response.data['data']));
    } on DioException catch (exception) {
      // Server already has an open shift for this kassa — fetch & return it.
      final data = exception.response?.data;
      final message = data is Map ? (data['error'] ?? data['message']) : null;
      final alreadyOpen =
          message is String && message.toLowerCase().contains('already');
      if (alreadyOpen) {
        final existing = await checkShift(id: request.cashRegisterId);
        return existing.fold(
          (_) => Left(handleDioException(exception)),
          (shift) => shift != null
              ? Right(shift)
              : Left(handleDioException(exception)),
        );
      }
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on String catch (e) {
      return Left(MessageFailure(e));
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, ShiftResponseModel?>> checkShift({
    required String id,
  }) async {
    try {
      final response = await _client.get(
        ListAPI.activeShift,
        queryParameters: {"cash_register_id": id},
      );
      final raw = response.data;
      final data = raw is Map<String, dynamic> ? raw['data'] : null;
      if (data is! Map<String, dynamic> || data.isEmpty) {
        return const Right(null);
      }
      return Right(ShiftResponseModel.fromJson(data));
    } on DioException catch (e) {
      // 404 / "no active shift" is a real "none" answer — let UI show the open flow.
      if (e.response?.statusCode == 404) {
        return const Right(null);
      }
      if (kDebugMode) {
        print('[checkShift] DioException ${e.response?.statusCode}: ${e.response?.data}');
      }
      return Left(handleDioException(e));
    } on TypeError catch (e, st) {
      if (kDebugMode) print('[checkShift] parse TypeError: $e\n$st');
      return const Left(ParsingFailure());
    } on FormatException catch (e, st) {
      if (kDebugMode) print('[checkShift] FormatException: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('[checkShift] unexpected: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, List<UserModel>>> getUsers() async {
    // Vaqtincha: `GET /api/v1/users` — ba’zi rollarda 403; chaqiruv o‘chirilgan.
    return const Right(<UserModel>[]);

    /* Qayta yoqish:
    try {
      final response = await _client.get(ListAPI.users);
      final raw = response.data['data'];
      List<dynamic> list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map && raw['data'] is List) {
        list = raw['data'] as List;
      } else {
        list = [];
      }
      return Right(
        list
            .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
    */
  }

  @override
  Future<Either<Failure, UserModel>> getUser() async {
    try {
      final response = await _client.get(ListAPI.user);
      return Right(UserModel.fromJson(response.data['data']));
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on String catch (e) {
      return Left(MessageFailure(e));
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<String> getOrderIdWithTableId({required String tableId}) async {
    try {
      final orders = await _client.dio.get(ListAPI.orderWithTableId(tableId));
      return orders.data['data'][0]['id'] ?? '';
    } catch (e) {
      return '';
    }
  }

  @override
  Future<Either<Failure, bool>> createPayment({
    required PaymentPayRequestEntity request,
  }) async {
    try {
      await _client.post(
        ListAPI.payToOrder(request.orderId),
        data: request.request(),
      );
      return const Right(true);
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on String catch (e) {
      return Left(MessageFailure(e));
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, String>> createTakewayOrder({
    required CreateOrderRequestModel request,
  }) async {
    try {
      final response = await _client.post(
        ListAPI.orders,
        data: request.createOrder(),
      );
      return Right(response.data['data']['id']);
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, bool>> createOrder({
    required CreateOrderRequestModel request,
  }) async {
    try {
      if (request.tableStatus == TableStatus.busy) {
        final orderId = await getOrderIdWithTableId(
          tableId: request.tableId,
        );
        if (orderId.isNotEmpty) {
          final req = request.request();
          await _client.post(
            ListAPI.orderItems(orderId),
            queryParameters: {'lang': 'uz'},
            data: {'items': req['items']},
          );
        }
      } else if (request.tableStatus == TableStatus.away) {
        await _client.post(ListAPI.orders, data: request.request());
      } else {
        await _client.post(ListAPI.orders, data: request.request());
      }
      return const Right(true);
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, List<CafeTableModel>>> getTablesByHallId(
    String hallId,
  ) async {
    try {
      final response = await _client.get(
        "${ListAPI.cafeTablesByHallId}/$hallId",
      );

      return Right(
        (response.data['data'] as List?)
                ?.map((e) => CafeTableModel.fromJson(e))
                .toList() ??
            [],
      );
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, List<HallModel>>> getHalls() async {
    try {
      final response = await _client.get(ListAPI.halls);

      return Right(
        (response.data['data'] as List?)
                ?.map((e) => HallModel.fromJson(e))
                .toList() ??
            [],
      );
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, List<CategoryModel>>> getCategories() async {
    try {
      final response = await _client.get(ListAPI.categories);

      return Right(
        (response.data['data'] as List?)
                ?.map((e) => CategoryModel.fromJson(e))
                .toList() ??
            [],
      );
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, ArchiveDetailEntity>> getPaymentDetailWithId(
    String id,
  ) async {
    try {
      final response = await _client.dio.get(ListAPI.archiveWithId(id));
      return Right(ArchiveDetailModel.fromJson(response.data['data']));
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on String catch (e) {
      return Left(MessageFailure(e));
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, ArchiveDetailEntity>> getPaymentDetailWithTableId(
    String id,
  ) async {
    try {
      // orders/table endpoint — orderIdni VA service_percentni birga olamiz
      final ordersRes = await _client.dio.get(ListAPI.orderWithTableId(id));
      final orderData =
          ordersRes.data['data'][0] as Map<String, dynamic>? ?? {};
      final orderId = orderData['id'] as String? ?? '';
      if (orderId.isEmpty) {
        throw "To'lov ma'lumotlarini olishda xatolik yuzaga keldi";
      }
      final rawSp = orderData['service_percent'];
      final orderServicePercent = rawSp is num ? rawSp.toDouble() : 0.0;

      final response = await _client.dio.get(ListAPI.archiveWithId(orderId));
      var detail = ArchiveDetailModel.fromJson(response.data['data']);
      // bills endpoint open order uchun service_percent qaytarmasligi mumkin —
      // orders/table javobidagini fallback sifatida ishlatamiz
      if (detail.servicePercent == 0.0 && orderServicePercent > 0) {
        detail = detail.copyWith(servicePercent: orderServicePercent);
      }
      return Right(detail);
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on String catch (e) {
      return Left(MessageFailure(e));
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, List<GoodsModel>>> getGoodsByCategoryId(
    String categoryId,
  ) async {
    try {
      if (categoryId == 'all') {
        final response = await _client.get(ListAPI.goods);

        return Right(
          (response.data['data'] as List?)
                  ?.map((e) => GoodsModel.fromJson(e))
                  .toList() ??
              [],
        );
      } else {
        final response = await _client.get(ListAPI.categoriesGoods(categoryId));

        return Right(
          (response.data as List?)
                  ?.map((e) => GoodsModel.fromJson(e))
                  .toList() ??
              [],
        );
      }
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, List<GoodsModel>>> getGoodsWithName(
    String name,
  ) async {
    try {
      final response = await _client.dio.get(
        ListAPI.goods,
        queryParameters: {'search': name, 'limit': 100},
      );

      final list = response.data['data'] as List? ??
          (response.data is List ? response.data as List : []);
      return Right(
        list.map((e) => GoodsModel.fromJson(e)).toList(),
      );
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, ArchivesResponseEntity>> getArchives(
    ArchivesFilterRequestEntity request,
  ) async {
    try {
      final response = await _client.dio.get(
        ListAPI.archives,
        queryParameters: request.request(),
      );
      Map<String, dynamic> json = response.data['data'];
      json['pagination'] = {
        "total": response.data['data']['total'],
        "limit": response.data['data']['limit'],
        "offset": response.data['data']['offset'],
      };
      return Right(ArchivesResponseModel.fromJson(json));
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }

  @override
  Future<Either<Failure, ArchiveDetailEntity>> getArchiveWithId(
    String id,
  ) async {
    try {
      final response = await _client.dio.get(ListAPI.archiveWithId(id));
      return Right(ArchiveDetailModel.fromJson(response.data['data']));
    } on DioException catch (exception) {
      return Left(handleDioException(exception));
    } on FormatException catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } on TypeError catch (e, st) {
      if (kDebugMode) print('ParsingError: $e\n$st');
      return const Left(ParsingFailure());
    } catch (e, st) {
      if (kDebugMode) print('Unknown error: $e\n$st');
      return const Left(UnknownFailure());
    }
  }
}
