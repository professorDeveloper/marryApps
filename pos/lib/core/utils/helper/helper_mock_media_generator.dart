//! USE ONLY FOR TESTING

import 'dart:math';

class HelperMockMediaGenerator {
  static final _rand = Random();

  /// Random photo (landscape)
  static String randomImage({int width = 400, int height = 700}) {
    return 'https://picsum.photos/seed/${_rand.nextInt(9999)}/$width/$height';
  }

  /// Square image (good for avatars)
  static String randomAvatar({int size = 200}) {
    return 'https://picsum.photos/seed/avatar${_rand.nextInt(9999)}/$size/$size';
  }

  /// audio (mp3)
  static String randomAudio() {
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${_rand.nextInt(16)}.mp3';
  }

  static String bigBuckBunny =
      'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';

  static String atomicHabits =
      "https://dn790007.ca.archive.org/0/items/atomic-habits-pdfdrive/Atomic%20habits%20%28%20PDFDrive%20%29.pdf";
}
