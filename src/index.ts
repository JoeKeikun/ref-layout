import {
  sortedIndex,
  findNearest,
  calcRectRefLines,
  fixNumber,
} from './lib'

import {
  DECIMALS,
} from './const'

import {
  Rect,
} from './interface'

// 默认配置
const DEFAULT_CONFIG: any = {
  adsorbDistance: 0,
  rects: [],
  active: null,
  // 垂直吸附线
  adsorbVLines: [],
  // 水平吸附线
  adsorbHLines: [],
  // 垂直网格线
  gridVLines: [],
  // 水平网格线
  gridHLines: [],
}

export default class Layout {
  // 吸附响应距离
  private _adsorbDistance: number = 0;

  // rect 缓存
  private _rects: Rect[] = null;
  // 选中 对象
  private _activeRect: Rect = null;
  // 选中 吸附对象 (副本)
  private _adsorbActiveRect: Rect = null;

  // line 缓存
  private _lines: any = {
    // 垂直线
    vLines: new Map(),
    // 垂直位置参数
    vPositions: [],
    // 水平线
    hLines: new Map(),
    // 水平位置参数
    hPositions: [],
  };

  // 网格 缓存
  private _grid: any = {
    // 垂直位置参数
    vPositions: [],
    // 水平位置参数
    hPositions: [],
  };

  // 吸附参数
  private _preOffsetX: number = null;
  private _preOffsetY: number = null;
  private _preLeft: number = null;
  private _preLeftAdsorbed: boolean = false;
  private _preTop: number = null;
  private _preTopAdsorbed: boolean = false;

  /* 构造 */
  constructor(config: any) {
    let tmpConfig = Object.assign({}, DEFAULT_CONFIG, config)

    // 更新数据
    this.updateActive(tmpConfig.active)
    this.updateRects(tmpConfig.rects)
    this.updateAdsorbLine(tmpConfig.adsorbVLines, 'v')
    this.updateAdsorbLine(tmpConfig.adsorbHLines, 'h')
    this.updateGridLine(tmpConfig.gridVLines, 'v')
    this.updateGridLine(tmpConfig.gridHLines, 'h')
    // 更新吸附距离
    this.updateAdsorbDistance(tmpConfig.adsorbDistance)
  }

  /* 更新 吸附响应距离 */
  public updateAdsorbDistance(v: number) {
    this._adsorbDistance = v;
  }

  /* 更新 rect 缓存 */
  public updateRects(rectsArr: Rect[]) {
    const sLines = this._lines;

    // 更新 line 缓存
    sLines.vLines = new Map()
    sLines.vPositions = []
    sLines.hLines = new Map()
    sLines.hPositions = []

    const tRects = []

    for (let rect of rectsArr) {
      if (rect === this._activeRect || (this._activeRect && rect.id === this._activeRect.id)) {
        continue
      }

      tRects.push(rect)

      const {
        id,
      } = rect

      const curLines = calcRectRefLines(rect)

      // 垂直线
      for (let tmpL of curLines.v) {
        const pos = Number(tmpL.pos)

        let arr = sLines.vLines.get(pos)

        if (!arr) {
          arr = []

          const index = sortedIndex(pos, sLines.vPositions)

          sLines.vPositions.splice(index, 0, pos)
        }

        arr.push({
          ...tmpL,
          id,
        })

        sLines.vLines.set(tmpL.pos, arr)
      }
      // 水平线
      for (let tmpL of curLines.h) {
        const pos = Number(tmpL.pos)

        let arr = sLines.hLines.get(pos)

        if (!arr) {
          arr = []

          const index = sortedIndex(pos, sLines.hPositions)

          sLines.hPositions.splice(index, 0, pos)
        }

        arr.push({
          ...tmpL,
          id,
        })

        sLines.hLines.set(tmpL.pos, arr)
      }
    }

    this._rects = tRects;
  }

  /* 更新 选中 对象 */
  public updateActive(active: Rect) {
    // 更新 line 选中
    this._activeRect = {
      ...active
    }

    // this._preOffsetX = null
    // this._preOffsetY = null
    // this._preLeft = null
    // this._preLeftAdsorbed = false
    // this._preTop = null
    // this._preTopAdsorbed = false
  }

  /* 更新 吸附 线条 */
  public updateAdsorbLine(linePositions: number[], type: string) {
    // 参数错误
    if (['v', 'h'].indexOf(type) === -1 || !Array.isArray(linePositions)) {
      return
    }

    let lineCache
    let posCache

    // 垂直线
    if (type === 'v') {
      lineCache = this._lines.vLines
      posCache = this._lines.vPositions
    }
    // 水平线
    else {
      lineCache = this._lines.hLines
      posCache = this._lines.hPositions
    }

    for (let tmpL of linePositions) {
      const pos = Number(tmpL)

      let arr = lineCache.get(pos)

      if (!arr) {
        arr = []

        const index = sortedIndex(pos, posCache)

        posCache.splice(index, 0, tmpL)
      }

      arr.push({
        isAdsorbLine: true,
        pos: tmpL,
        start: 0,
        end: 0,
      })

      lineCache.set(tmpL, arr)
    }
  }

  /* 更新 网格 线条 */
  public updateGridLine(gridPositions: number[], type: string) {
    // 参数错误
    if (['v', 'h'].indexOf(type) === -1 || !Array.isArray(gridPositions)) {
      return
    }

    // 垂直线
    if (type === 'v') {
      this._grid.vPositions = gridPositions.map(i => Number(i) || 0).sort(function (a, b) {
        return a - b
      })
    }
    // 水平线
    else {
      this._grid.hPositions = gridPositions.map(i => Number(i) || 0).sort(function (a, b) {
        return a - b
      })
    }
  }

  /* 计算吸附 */
  public calcAdsorb(offsetX: number, offsetY: number) {
    this._adsorbActiveRect = null

    let xChanged: boolean = this._preOffsetX != null && offsetX !== this._preOffsetX
    let yChanged: boolean = this._preOffsetY != null && offsetY !== this._preOffsetY
    let leftAdsorbed: boolean = false
    let topAdsorbed: boolean = false

    if (this._activeRect) {
      this._adsorbActiveRect = {
        width: this._activeRect.width,
        height: this._activeRect.height,
        top: fixNumber(this._activeRect.top + offsetY, DECIMALS),
        left: fixNumber(this._activeRect.left + offsetX, DECIMALS),
      }

      const line = calcRectRefLines(this._adsorbActiveRect)

      let vMin: any = {
        gap: -1,
        offset: 0,
      }
      let hMin: any = {
        gap: -1,
        offset: 0,
      }

      // x 轴
      if (xChanged) {
        for (let tmpL of line.v) {
          const pos = Number(tmpL.pos)

          const nearestPos = findNearest(pos, this._lines.vPositions)

          const offset = fixNumber(nearestPos - pos, DECIMALS)
          const gap = Math.abs(offset)

          if (vMin.gap === -1) {
            vMin.gap = gap
            vMin.offset = offset
          } else if (vMin.gap > gap) {
            vMin.gap = gap
            vMin.offset = offset
          }
        }

        if (vMin.gap !== -1 && vMin.gap < this._adsorbDistance) {
          leftAdsorbed = true
          this._adsorbActiveRect.left = fixNumber(this._adsorbActiveRect.left + vMin.offset, DECIMALS)
        }
      } else {
        if (this._preLeft != null) {
          leftAdsorbed = this._preLeftAdsorbed
          this._adsorbActiveRect.left = this._preLeft
        }
      }
      // y 轴
      if (yChanged) {

        for (let tmpL of line.h) {
          const pos = Number(tmpL.pos)

          const nearestPos = findNearest(pos, this._lines.hPositions)

          const offset = fixNumber(nearestPos - pos, DECIMALS)
          const gap = Math.abs(offset)

          if (hMin.gap === -1) {
            hMin.gap = gap
            hMin.offset = offset
          } else if (hMin.gap > gap) {
            hMin.gap = gap
            hMin.offset = offset
          }
        }

        if (hMin.gap !== -1 && hMin.gap < this._adsorbDistance) {
          topAdsorbed = true
          this._adsorbActiveRect.top = fixNumber(this._adsorbActiveRect.top + hMin.offset, DECIMALS)
        }
      } else {
        if (this._preTop != null) {
          topAdsorbed = this._preTopAdsorbed
          this._adsorbActiveRect.top = this._preTop
        }
      }

      if (!leftAdsorbed && this._grid.vPositions.length > 0) {
        const nearestGridPos = findNearest(this._adsorbActiveRect.left, this._grid.vPositions)

        this._adsorbActiveRect.left = nearestGridPos
      }
      if (!topAdsorbed && this._grid.hPositions.length > 0) {
        const nearestGridPos = findNearest(this._adsorbActiveRect.top, this._grid.hPositions)

        this._adsorbActiveRect.top = nearestGridPos
      }

      this._preOffsetX = offsetX
      this._preOffsetY = offsetY
      this._preLeft = this._adsorbActiveRect.left
      this._preLeftAdsorbed = leftAdsorbed
      this._preTop = this._adsorbActiveRect.top
      this._preTopAdsorbed = topAdsorbed
    }
  }

  /* 读取 选中 吸附对象 (副本) */
  public getAdsorbActiveRect() {
    return this._adsorbActiveRect;
  }

  /* 读取 参考线对象 */
  public getRefLines() {
    const result: any[] = []

    if (!this._adsorbActiveRect) {
      return result
    }

    const line = calcRectRefLines(this._adsorbActiveRect)

    // 垂直
    for (let i = 0; i < line.v.length; i++) {
      const tmp = line.v[i]

      let arr = this._lines.vLines.get(tmp.pos)

      if (arr) {
        arr = arr.filter((i: any) => !i.isAdsorbLine)

        let min: number = tmp.start
        let max: number = tmp.end
        let rects: any = []

        arr.forEach((t: any) => {
          min = Math.min(t.start, min)
          max = Math.max(t.end, max)

          if (this._rects) {
            rects.push(this._rects.find((r: Rect) => r.id === t.id))
          }
        })

        result.push({
          type: 'v',
          left: tmp.pos,
          top: min,
          size: max - min,
          refRects: rects,
        })
      }
    }
    // 水平
    for (let i = 0; i < line.h.length; i++) {
      const tmp = line.h[i]

      let arr = this._lines.hLines.get(tmp.pos)

      if (arr) {
        arr = arr.filter((i: any) => !i.isAdsorbLine)

        let min: number = tmp.start
        let max: number = tmp.end
        let rects: any = []

        arr.forEach((t: any) => {
          min = Math.min(t.start, min)
          max = Math.max(t.end, max)

          if (this._rects) {
            rects.push(this._rects.find(r => r.id === t.id))
          }
        })

        result.push({
          type: 'h',
          top: tmp.pos,
          left: min,
          size: max - min,
          refRects: rects,
        })
      }
    }

    return result
  }
}