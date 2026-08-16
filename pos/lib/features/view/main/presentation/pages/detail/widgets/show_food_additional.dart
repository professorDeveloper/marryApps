import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
import 'package:mary_ai_pos/core/common/custom_text_field.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';
import 'package:mary_ai_pos/features/view/main/data/models/food_additional/food_additional_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';
import 'package:mary_ai_pos/generated/l10n.dart';
import 'package:virtual_keyboard_multi_language/virtual_keyboard_multi_language.dart';

class ShowFoodAdditional extends StatefulWidget {
  final List<FoodAdditionalModel> additionals;
  final GoodsModel goods;
  final String comment;
  const ShowFoodAdditional({
    super.key,
    required this.additionals,
    required this.goods,
    required this.comment,
  });

  @override
  State<ShowFoodAdditional> createState() => _ShowFoodAdditionalState();
}

class _ShowFoodAdditionalState extends State<ShowFoodAdditional> {
  late final ValueNotifier<bool> keyboardOpen = ValueNotifier<bool>(false);
  late final TextEditingController textEditingController;

  @override
  void initState() {
    super.initState();
    textEditingController = TextEditingController(text: widget.comment);
  }

  @override
  void dispose() {
    super.dispose();
    textEditingController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        if (keyboardOpen.value) {
          keyboardOpen.value = false;
        }
      },
      child: Center(
        child: Material(
          borderRadius: context.radius.card20,
          color: Colors.transparent,
          child: ValueListenableBuilder(
            valueListenable: keyboardOpen,
            builder: (context, value, child) {
              return DecoratedBox(
                decoration: const BoxDecoration(color: Colors.transparent),
                child: Stack(
                  children: [
                    Align(
                      alignment: Alignment.center,
                      child: Container(
                        width: 450,
                        padding: const EdgeInsets.all(20),
                        clipBehavior: Clip.antiAlias,
                        decoration: ShapeDecoration(
                          color: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  widget.goods.name,
                                  style: context.textStyles.bold20.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  "Jami:",
                                  style: context.textStyles.title14.copyWith(
                                    fontSize: 16,
                                    color: context.colors.iconSecondary,
                                  ),
                                ),
                                Text(
                                  num.parse(widget.goods.price).formatNWithoutS,
                                  style: context.textStyles.semibold20.copyWith(
                                    color: const Color(0xFFFB6633),
                                  ),
                                ),
                              ],
                            ),
                            16.hBox,
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const BouncingScrollPhysics(),
                              itemBuilder: (context, index) {
                                ValueNotifier<bool> selected =
                                    ValueNotifier<bool>(
                                      widget.additionals[index].selected,
                                    );
                                return ValueListenableBuilder(
                                  valueListenable: selected,
                                  builder: (context, value, child) => SizedBox(
                                    width: context.w,
                                    height: 57,
                                    child: DecoratedBox(
                                      decoration: BoxDecoration(
                                        color: context.colors.bgTritary,
                                        borderRadius: context.radius.buttonLg,
                                      ),
                                      child: Row(
                                        children: [
                                          Text(
                                            widget.additionals[index].title,
                                            style: context.textStyles.bodyLg
                                                .copyWith(
                                                  fontSize: 16,
                                                  color: value
                                                      ? context
                                                            .textStyles
                                                            .displayXl
                                                            .color
                                                      : context
                                                            .textStyles
                                                            .bodyLg
                                                            .color,
                                                ),
                                          ),
                                          const Spacer(),
                                          if (widget.additionals[index].price >
                                              0)
                                            Text(
                                              "+${widget.additionals[index].price.formatN}",
                                              style: context.textStyles.title14
                                                  .copyWith(
                                                    fontSize: 13,
                                                    color: AppColors.ff1ECA27,
                                                  ),
                                            ),
                                          Material(
                                            child: Checkbox(
                                              value: value,
                                              onChanged: (value) {
                                                if (value != null) {
                                                  selected.value = value;
                                                  widget
                                                          .additionals[index]
                                                          .selected =
                                                      value;
                                                }
                                              },
                                            ),
                                          ),
                                        ],
                                      ).paddingSymmetric(horizontal: 16),
                                    ),
                                  ),
                                );
                              },
                              separatorBuilder: (context, index) => 12.hBox,
                              itemCount: widget.additionals.length,
                            ),
                            24.hBox,
                            Text(
                              "Maxsus izoh",
                              style: context.textStyles.semibold20.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            16.hBox,
                            CustomTextField(
                              hintText: S.current.strForNotes,
                              textInputType: TextInputType.text,
                              maxLines: 3,
                              onTap: () => keyboardOpen.value = true,
                              textEditingController: textEditingController,
                            ),
                            24.hBox,
                            SizedBox(
                              width: context.w,
                              height: 56,
                              child: Row(
                                children: [
                                  Expanded(
                                    child: CustomHoverEffectWidget(
                                      onTap: () => Navigator.pop(context),
                                      borderRadius: context.radius.buttonLg,
                                      child: Center(
                                        child: Text(S.current.strCancel),
                                      ),
                                    ),
                                  ),
                                  8.wBox,
                                  Expanded(
                                    child: CustomHoverEffectWidget(
                                      onTap: () => Navigator.pop(context, {
                                        "additional": widget.additionals
                                            .where((v) => v.selected)
                                            .toList(),
                                        "comment": textEditingController.text,
                                      }),
                                      borderRadius: context.radius.buttonLg,
                                      bgColor: context.colors.buttonBrand,
                                      child: Center(
                                        child: Text(
                                          S.current.strAdd,
                                          style: context.textStyles.bold16
                                              .copyWith(
                                                fontWeight: FontWeight.w500,
                                                color:
                                                    context.colors.textOnBrand,
                                              ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ).paddingOnly(bottom: value ? context.h * 0.2 : 0),
                    ),

                    if (value)
                      Align(
                        alignment: Alignment.bottomCenter,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: context.colors.bgDefault,
                          ),
                          child: VirtualKeyboard(
                            textController: textEditingController,
                            type: VirtualKeyboardType.Alphanumeric,
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
