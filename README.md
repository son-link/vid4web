# Vid4Web
Convert your videos to ready to play videos for Internet.

(c) 2018 Alfonso Saavedra "Son Link"

Under the GPlv3 License or upper.

## How to use

### Install from NPMJS

```sh
npm install -g vid4web
```
### Local
Clone the repo or download the last release and uncompress, open a terminal and type:

```sh
npm install .
```

This install all dependencies. For run type:

```sh
node .
```

or install globally:

```sh
npm install -g vid4web
```

# Node modules used:

* [libui-node](https://github.com/parro-it/libui-node) for the GUI
* [node-fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) for easy to use ffmpeg.
* [mmmagic](https://github.com/mscdex/mmmagic) for get input file mime type.

# F.A.Q.S:

* **What is the output format?** At the moment only mp4, but i add in nexts release **WebM**

* **I only select 3 resolutions. Is posible to add custom resolution?** Not at the moment. I add the 3 popular resolutions. Under 480p (858x480) the video is small, and upper 1080p (1920x1080) the video size is too big. Maybe in the future i add custom fields for resolution, video bitrate, etc.

* **What Operative Systems support?** It's avaliable for **GNU/Linux**, **Windows** and **MacOS**, but i do not use the 2 lasts S.O. and i can upload precompiled versions for this systems.