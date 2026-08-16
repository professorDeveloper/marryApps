import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
import 'package:mary_ai_pos/core/common/custom_text_field.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/utils/app_formatter.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/archives/archives_bloc.dart';
import 'package:mary_ai_pos/gen/assets.gen.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class ArchiveTopBar extends StatelessWidget {
  const ArchiveTopBar({super.key});

  @override
  Widget build(BuildContext context) {
    final List<String> names = [
      S.current.all,
      S.current.today,
      S.current.week,
      S.current.month,
    ];
    return DecoratedBox(
      decoration: BoxDecoration(
        color: context.colors.bgDefault,
        borderRadius: context.radius.card24,
      ),
      child: BlocBuilder<ArchivesBloc, ArchivesState>(
        builder: (context, state) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: CustomTextField(
                        textEditingController: state.textController,
                        hintText: S.current.strSearchByCheckNumber,
                        textInputType: TextInputType.number,
                        formatter: [AppFormatter.numberOnlyFormatter],
                        onChange: (value) => context.read<ArchivesBloc>().add(
                          ArchivesEvent.searchByArchiveNum(value),
                        ),
                        suffixIcon: SvgPicture.asset(
                          Assets.icons.icSearch.path,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              16.hBox,
              Row(
                children: [
                  SizedBox(
                    width: 52,
                    height: 52,
                    child: CustomHoverEffectWidget(
                      bgColor: state.filterType == ArchivesFilterType.date
                          ? context.colors.buttonBrand
                          : context.colors.bgTritary,
                      onTap: () async {
                        final pickedRange = await showDateRangePicker(
                          context: context,
                          initialDateRange: DateTimeRange(
                            start: DateTime.now(),
                            end: DateTime.now(),
                          ),
                          firstDate: DateTime(2000),
                          lastDate: DateTime.now().add(
                            const Duration(days: 365 * 10),
                          ),
                          initialEntryMode: DatePickerEntryMode.calendarOnly,
                          builder: (context, child) {
                            return Center(
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(
                                  maxWidth: 400.0,
                                  maxHeight: 600.0,
                                ),
                                child: child,
                              ),
                            );
                          },
                        );
                        if (pickedRange != null) {
                          context.read<ArchivesBloc>().add(
                            ArchivesEvent.updateFilterDateRange(
                              startDate: pickedRange.start,
                              endDate: pickedRange.end,
                            ),
                          );
                        }
                      },
                      borderRadius: context.radius.buttonLg,
                      child: SvgPicture.asset(
                        Assets.icons.icCalendar.path,
                        color: state.filterType == ArchivesFilterType.date
                            ? context.colors.bgTritary
                            : context.colors.buttonBrand,
                      ).paddingAll(12),
                    ),
                  ),
                  8.wBox,
                  Row(
                    children: List.generate(
                      state.filters.length,
                      (index) => SizedBox(
                        height: 52,
                        child: CustomHoverEffectWidget(
                          onTap: () => context.read<ArchivesBloc>().add(
                            ArchivesEvent.updateFilterType(
                              type: state.filters[index],
                            ),
                          ),
                          borderRadius: context.radius.buttonLg,
                          bgColor: state.filterType == state.filters[index]
                              ? context.colors.buttonBrand
                              : null,
                          child: Center(
                            child: Text(
                              names[index],
                              style: context.textStyles.bold16.copyWith(
                                fontWeight: FontWeight.w500,
                                color: state.filterType == state.filters[index]
                                    ? context.colors.bgDefault
                                    : context.colors.textDefault,
                              ),
                            ),
                          ).paddingSymmetric(horizontal: 20),
                        ),
                      ).paddingOnly(right: 8),
                    ),
                  ),

                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(S.current.strTotalLabel, style: context.textStyles.bodyMd),
                      Text(
                        "${state.archives?.pagination.total ?? 0} ta chek",
                        style: context.textStyles.bold20.copyWith(
                          fontWeight: FontWeight.w500,
                          color: context.colors.bgBrand,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          );
        },
      ).paddingAll(16),
    );
  }
}
