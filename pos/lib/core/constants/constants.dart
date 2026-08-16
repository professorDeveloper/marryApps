// ignore_for_file: constant_identifier_names
const BASE_URL = 'https://api.maryai.uz/';
// const BASE_URL = 'https://back.maryai.yurtal.tech/';
// const BASE_URL = 'https://back.staging.maryai.yurtal.tech/';
// const BASE_URL = 'http://localhost:8080/';
// const BASE_URL = 'http://192.168.0.125:8080/';

const ACCESS_TOKEN = 'access-token';
const REFRESH_TOKEN = 'refresh-token';

const APP_LANGUAGE = 'app-lang';
const APP_THEME = 'app-theme';

const TECHNICAL_SUPPORT_URL = '';

/// Vaqtincha: ochiq buyurtma yopish ekranida xizmat 0% — jami faqat faol qatorlar yig‘indisi (API `total_amount` xizmatni e’tiborsiz qiladi).
const bool kOpenOrderServiceFeeZeroPercent = true;

enum UserRole {admin, manager, cashier, waiter, kitchen, user, superadmin,none}


enum CashStatus {open, close, none}

enum ShiftSumType {cash,card}

enum Status { LOADING, UNKNOWN, SUCCESS, ERROR, OTHER, OTHER_LOADING, IDLE }

enum OrderStatus { opened, pending, open, closed, paid, debt, deleted, none }

enum ArchivesFilterType { All, Today, Week, month, date }

enum GoodsCategoryType { all, category }

enum PaymentType { cash, card, qr }

enum DiscountType { money, percent }

class LangModel {
  final String code;
  final String title;
  final String icon;

  const LangModel({
    required this.icon,
    required this.code,
    required this.title,
  });
}

const REPLACE_SIGN = "_?";

const avatarImg =
    'https://i.pinimg.com/736x/15/0f/a8/150fa8800b0a0d5633abc1d1c4db3d87.jpg';

const audioUrl =
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

const videoUrl =
    "https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4";

const pdfUrl =
    "https://dn790007.ca.archive.org/0/items/atomic-habits-pdfdrive/Atomic%20habits%20%28%20PDFDrive%20%29.pdf";

const kDefaultDuration300 = Duration(milliseconds: 300);

typedef JSON = Map<String, dynamic>;

// flutter pub run build_runner build --delete-conflicting-outputs
// flutter pub run intl_utils:generate
