import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/common/custom_shimmer_container.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/features/view/main/data/models/category/category_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

const _kS900 = Color(0xFF0F172A);
const _kS200 = Color(0xFFE2E8F0);
const _kS100 = Color(0xFFF1F5F9);

class DetailTabFilter extends StatelessWidget {
  const DetailTabFilter({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DetailBloc, DetailState>(
      builder: (context, state) {
        if (state.status == Status.LOADING && state.categories == null) {
          return SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemBuilder: (context, index) => CustomShimmerBox(
                h: 44,
                w: 120,
                borderRadius: context.radius.buttonLg,
              ),
              separatorBuilder: (context, index) => 6.wBox,
              itemCount: 10,
            ),
          );
        }

        if (state.status != Status.LOADING && state.categories == null) {
          return Center(
            child: Text(S.current.strFoodsCategoriesNotFound.trim()),
          );
        }

        return SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemBuilder: (context, index) => _TabButton(
              category: state.categories![index],
              isActive:
                  state.categories![index].id == state.selectedCategoryId,
            ),
            separatorBuilder: (context, index) => 6.wBox,
            itemCount: state.categories?.length ?? 0,
          ),
        );
      },
    );
  }
}

class _TabButton extends StatefulWidget {
  final CategoryModel category;
  final bool isActive;

  const _TabButton({required this.category, required this.isActive});

  @override
  State<_TabButton> createState() => _TabButtonState();
}

class _TabButtonState extends State<_TabButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final active = widget.isActive;
    final Color bg;
    final Color borderColor;
    if (active) {
      bg = _kS900;
      borderColor = _kS900;
    } else if (_hovered) {
      bg = _kS100;
      borderColor = _kS200;
    } else {
      bg = Colors.white;
      borderColor = _kS200;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () => context.read<DetailBloc>().add(
          DetailEvent.setSelectedCategoryId(id: widget.category.id),
        ),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: bg,
            border: Border.all(color: borderColor),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.category.name,
                style: TextStyle(
                  color: active ? Colors.white : _kS900,
                  fontSize: 15,
                  fontFamily: 'Inter',
                  fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
