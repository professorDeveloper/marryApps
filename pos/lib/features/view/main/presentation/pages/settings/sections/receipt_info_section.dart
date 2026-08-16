import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/service/receipt/receipt_info_storage.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/widgets/section_shell.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class ReceiptInfoSection extends StatefulWidget {
  const ReceiptInfoSection({super.key});

  @override
  State<ReceiptInfoSection> createState() => _ReceiptInfoSectionState();
}

class _ReceiptInfoSectionState extends State<ReceiptInfoSection> {
  late final ReceiptInfoStorage _storage;
  late final TextEditingController _name;
  late final TextEditingController _address;
  late final TextEditingController _phone;
  bool _saving = false;
  bool _savedFlash = false;

  @override
  void initState() {
    super.initState();
    _storage = inject<ReceiptInfoStorage>();
    final info = _storage.current;
    _name = TextEditingController(text: info.companyName);
    _address = TextEditingController(text: info.address);
    _phone = TextEditingController(text: info.phone);
  }

  @override
  void dispose() {
    _name.dispose();
    _address.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await _storage.save(
      ReceiptInfo(
        companyName: _name.text.trim(),
        address: _address.text.trim(),
        phone: _phone.text.trim(),
      ),
    );
    if (!mounted) return;
    setState(() {
      _saving = false;
      _savedFlash = true;
    });
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _savedFlash = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return SectionShell(
      title: S.current.strReceiptInfo,
      subtitle:
          'Kassir chekining sarlavhasida chiqadigan tashkilot ma\'lumotlari. Bo\'sh qoldirilsa standart qiymatlar ishlatiladi.',
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _Field(
            label: S.current.strOrgName,
            hint: 'Friends Club',
            controller: _name,
            icon: Icons.storefront_outlined,
          ),
          const SizedBox(height: 12),
          _Field(
            label: S.current.strAddress,
            hint: 'ул. Юсуфа Хос Ходжиба, 73',
            controller: _address,
            icon: Icons.location_on_outlined,
          ),
          const SizedBox(height: 12),
          _Field(
            label: S.current.strPhone,
            hint: '+998 95 143 30 00',
            controller: _phone,
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _SaveButton(
                saving: _saving,
                savedFlash: _savedFlash,
                onTap: _save,
              ),
              const SizedBox(width: 12),
              if (_savedFlash)
                const Text(
                  'Saqlandi',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF16A34A),
                    fontFamily: 'Inter',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Field ───────────────────────────────────────────────────────────────────

class _Field extends StatelessWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final IconData icon;
  final TextInputType? keyboardType;

  const _Field({
    required this.label,
    required this.hint,
    required this.controller,
    required this.icon,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF334155),
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF0F172A),
            fontFamily: 'Inter',
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              fontSize: 14,
              color: Color(0xFF94A3B8),
              fontFamily: 'Inter',
            ),
            prefixIcon: Icon(icon, size: 18, color: const Color(0xFF64748B)),
            filled: true,
            fillColor: Colors.white,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 12,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFFB6633)),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Save button ─────────────────────────────────────────────────────────────

class _SaveButton extends StatefulWidget {
  final bool saving;
  final bool savedFlash;
  final VoidCallback onTap;

  const _SaveButton({
    required this.saving,
    required this.savedFlash,
    required this.onTap,
  });

  @override
  State<_SaveButton> createState() => _SaveButtonState();
}

class _SaveButtonState extends State<_SaveButton> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: GestureDetector(
        onTap: widget.saving ? null : widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 22),
          decoration: BoxDecoration(
            color: widget.saving
                ? const Color(0xFFFB6633).withOpacity(0.5)
                : _hover
                    ? const Color(0xFFEA5A2E)
                    : const Color(0xFFFB6633),
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: widget.saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator.adaptive(
                    strokeWidth: 2,
                    backgroundColor: Colors.white,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.check_rounded,
                      size: 16,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      widget.savedFlash ? 'Saqlandi' : 'Saqlash',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
