// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'pending_operation.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PendingOperationAdapter extends TypeAdapter<PendingOperation> {
  @override
  final int typeId = 11;

  @override
  PendingOperation read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PendingOperation(
      id: fields[0] as String,
      type: fields[1] as PendingOperationType,
      payload: fields[2] as String,
      tableId: fields[3] as String,
      createdAt: fields[4] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, PendingOperation obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.type)
      ..writeByte(2)
      ..write(obj.payload)
      ..writeByte(3)
      ..write(obj.tableId)
      ..writeByte(4)
      ..write(obj.createdAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PendingOperationAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class PendingOperationTypeAdapter extends TypeAdapter<PendingOperationType> {
  @override
  final int typeId = 10;

  @override
  PendingOperationType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return PendingOperationType.createOrder;
      case 1:
        return PendingOperationType.addItems;
      case 2:
        return PendingOperationType.payOrder;
      default:
        return PendingOperationType.createOrder;
    }
  }

  @override
  void write(BinaryWriter writer, PendingOperationType obj) {
    switch (obj) {
      case PendingOperationType.createOrder:
        writer.writeByte(0);
        break;
      case PendingOperationType.addItems:
        writer.writeByte(1);
        break;
      case PendingOperationType.payOrder:
        writer.writeByte(2);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PendingOperationTypeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
