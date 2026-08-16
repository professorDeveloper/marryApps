import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
import 'package:mary_ai_pos/core/extension/date_time_extension.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/archives/archives_bloc.dart';
import 'package:mary_ai_pos/gen/assets.gen.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class ArchiveRightSiderBar extends StatelessWidget {
  const ArchiveRightSiderBar({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: context.w,
      height: context.h,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: context.colors.textOnBrand,
          borderRadius: context.radius.card24,
        ),
        child: BlocBuilder<ArchivesBloc, ArchivesState>(
          builder: (context, state) {
            if (state.selectArchive == null) {
              return Center(
                child: Text(
                  S.current.strCheckForDetails,
                  style: context.textStyles.bodyMd,
                ),
              );
            }

            if (state.status == Status.LOADING &&
                state.selectArchiveDetail == null) {
              return const Center(child: CircularProgressIndicator.adaptive());
            }

            if (state.selectArchiveDetail == null) {
              return Center(
                child: Text(S.current.strCheckNotFound, style: context.textStyles.bodyMd),
              );
            }

            return ListView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                SizedBox(
                  width: context.w,
                  height: 52,
                  child: Row(
                    children: [
                      Flexible(
                        child: Text(
                          state.selectArchive!.totalPrice.formatN,
                          style: context.textStyles.bold20.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 12),
                      CustomHoverEffectWidget(
                        onTap: () {},
                        borderRadius: context.radius.buttonMd,
                        bgColor: context.colors.bgBrand,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SvgPicture.asset(
                              Assets.icons.icPrinter.path,
                              color: AppColors.white,
                            ),
                            10.wBox,
                            Text(
                              S.current.strPrint,
                              style: context.textStyles.title14.copyWith(
                                fontSize: 14,
                                color: context.colors.textOnBrand,
                              ),
                            ),
                          ],
                        ).paddingSymmetric(horizontal: 12),
                      ),
                    ],
                  ),
                ),
                16.hBox,
                SizedBox(
                  width: context.w,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: context.radius.buttonLg,
                      color: context.colors.bgTritary,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          S.current.strOrderDetails,
                          style: context.textStyles.bold20.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        16.hBox,
                        Row(
                          children: [
                            Text(
                              S.current.strCheckNumberLabel,
                              style: context.textStyles.bodySm,
                            ),
                            const Spacer(),
                            Text(
                              "#${state.selectArchive!.bilNumber}",
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        13.hBox,
                        Row(
                          children: [
                            Text(S.current.strTableLabel, style: context.textStyles.bodySm),
                            const Spacer(),
                            Text(
                              state.selectArchive!.tableNumber.toString(),
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        13.hBox,
                        Row(
                          children: [
                            Text(S.current.strDateLabel, style: context.textStyles.bodySm),
                            const Spacer(),
                            Text(
                              state.selectArchive!.opened.toYyyyMmDd,
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        13.hBox,
                        Row(
                          children: [
                            Text(S.current.strCashierLabel, style: context.textStyles.bodySm),
                            const Spacer(),
                            Text(
                              "Admin",
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        13.hBox,
                        Row(
                          children: [
                            Text(
                              S.current.strPaymentMethodLabel,
                              style: context.textStyles.bodySm,
                            ),
                            const Spacer(),
                            Text(
                              S.current.strCash,
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        13.hBox,
                        Row(
                          children: [
                            Text(S.current.strGiven, style: context.textStyles.bodySm),
                            const Spacer(),
                            Text(
                              state
                                      .selectArchiveDetail
                                      ?.customerPaidAmount
                                      .formatN ??
                                  "--",
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        13.hBox,
                        Row(
                          children: [
                            Text(S.current.strChange, style: context.textStyles.bodySm),
                            const Spacer(),
                            Text(
                              state.selectArchiveDetail?.changeAmount.formatN ??
                                  '--',
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ).paddingAll(16),
                  ),
                ),
                16.hBox,
                Text(
                  "Buyurtma tarkibi",
                  style: context.textStyles.bold20.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                12.hBox,
                Column(
                  spacing: 8,
                  children: List.generate(
                    state.selectArchiveDetail!.goods.length,
                    (index) => SizedBox(
                      width: context.w,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: context.radius.buttonLg,
                          color: context.colors.bgTritary,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  state.selectArchiveDetail!.goods[index].name,
                                  style: context.textStyles.bold16.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                8.hBox,
                                Text(
                                  "${state.selectArchiveDetail!.goods[index].name} x ${state.selectArchiveDetail!.goods[index].quantity}",
                                  style: context.textStyles.bodySm,
                                ),
                              ],
                            ),
                            Text(
                              state
                                  .selectArchiveDetail!
                                  .goods[index]
                                  .price
                                  .formatN,
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ).paddingSymmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),
                ),
                16.hBox,
                SizedBox(
                  width: context.h,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: context.radius.buttonLg,
                      color: context.colors.bgTritary,
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(S.current.strTotalLabel, style: context.textStyles.bodySm),
                            Text(
                              state.selectArchive!.goodsTotal.formatN,
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        12.hBox,
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Xizmat to'lovi:",
                              style: context.textStyles.bodySm,
                            ),
                            Text(
                              state.selectArchive!.serviceAmount.formatN,
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        12.hBox,
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(S.current.strAllColon, style: context.textStyles.bodySm),
                            Text(
                              state.selectArchive!.totalPrice.formatN,
                              style: context.textStyles.bold18.copyWith(
                                fontWeight: FontWeight.w500,
                                color: context.colors.bgBrand,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ).paddingAll(16),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
