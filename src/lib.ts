import {
  DECIMALS,
} from './const'

import {
  Rect,
} from './interface'

/**
 * 寻找目标插入的索引
 * @param {number} num 目标数值
 * @param {number[]} arr 数组
 */
export function sortedIndex(num: number, arr: number[]) {
  let low = 0
  let high = arr.length

  while (low < high) {
    let mid = (low + high) >>> 1

    if (arr[mid] < num) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return low
}

/**
 * 寻找目标接近邻近的数值
 * @param {number} num 目标数值
 * @param {number[]} arr 数组
 */
export function findNearest(num: number, arr: number[]) {
  let mid;
  let lo = 0;
  let hi = arr.length - 1;

  while (hi - lo > 1) {
    mid = Math.floor((lo + hi) / 2);
    if (arr[mid] < num) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (num - arr[lo] <= arr[hi] - num) {
    return arr[lo];
  }

  return arr[hi];
}

/**
 * 计算目标对象的横纵参考线
 * @param {object} rect 目标对象
 */
export function calcRectRefLines(rect: Rect) {
  const {
    top,
    left,
    width,
    height,
  } = rect;

  // 左
  const x1 = fixNumber(left, DECIMALS)
  // 中 - 水平
  const x2 = fixNumber(left + width / 2, DECIMALS)
  // 右
  const x3 = fixNumber(left + width, DECIMALS)
  // 上
  const y1 = fixNumber(top, DECIMALS)
  // 中 - 垂直
  const y2 = fixNumber(top + height / 2, DECIMALS)
  // 下
  const y3 = fixNumber(top + height, DECIMALS)

  return {
    v: [{
      type: 'vm',
      pos: x2,
      start: y1,
      end: y3
    }, {
      type: 'vl',
      pos: x1,
      start: y1,
      end: y3
    }, {
      type: 'vr',
      pos: x3,
      start: y1,
      end: y3
    }],
    h: [{
      type: 'hm',
      pos: y2,
      start: x1,
      end: x3
    }, {
      type: 'ht',
      pos: y1,
      start: x1,
      end: x3
    }, {
      type: 'hb',
      pos: y3,
      start: x1,
      end: x3
    }]
  }
}

/**
 * 提取小数对应位数的数值
 * @param {float} num 目标小数
 * @param {number} digitCount 小数位数
 */
export function fixNumber(num: number, digitCount: number) {
  return +(num.toFixed(digitCount))
}