class FoodAdditionalModel {
  final String title;
  bool _selected;
  final int price;

  FoodAdditionalModel({this.title = '', bool selected = false, this.price = 0})
    : _selected = selected;

  bool get selected => _selected;
  set selected(bool value) => _selected = value;
}
