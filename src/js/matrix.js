// Matrix utility functions for WebGL rendering

// Create a perspective matrix for the camera
export function createPerspectiveMatrix(fieldOfViewInRadians, aspectRatio, near, far) {
  const f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
  const rangeInv = 1 / (near - far);

  return [
    f / aspectRatio, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
}

// Create an orthographic projection matrix
export function createOrthographicMatrix(left, right, bottom, top, near, far) {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  return [
    -2 * lr, 0, 0, 0,
    0, -2 * bt, 0, 0,
    0, 0, 2 * nf, 0,
    (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
  ];
}

// Create a model view matrix for positioning objects
export function createModelViewMatrix(translation, rotation, scale) {
  const matrix = identityMatrix();
  
  // Apply transformations in the order: scale, rotate, translate
  if (scale) {
    scaleMatrix(matrix, scale[0], scale[1], scale[2]);
  }
  
  if (rotation) {
    rotateMatrix(matrix, rotation[0], [1, 0, 0]); // Rotate X
    rotateMatrix(matrix, rotation[1], [0, 1, 0]); // Rotate Y
    rotateMatrix(matrix, rotation[2], [0, 0, 1]); // Rotate Z
  }
  
  if (translation) {
    translateMatrix(matrix, translation[0], translation[1], translation[2]);
  }
  
  return matrix;
}

// Create an identity matrix
export function identityMatrix() {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

// Translate a matrix
export function translateMatrix(matrix, x, y, z) {
  matrix[12] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
  matrix[13] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
  matrix[14] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
  matrix[15] = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  
  return matrix;
}

// Scale a matrix
export function scaleMatrix(matrix, x, y, z) {
  matrix[0] *= x;
  matrix[1] *= x;
  matrix[2] *= x;
  matrix[3] *= x;
  
  matrix[4] *= y;
  matrix[5] *= y;
  matrix[6] *= y;
  matrix[7] *= y;
  
  matrix[8] *= z;
  matrix[9] *= z;
  matrix[10] *= z;
  matrix[11] *= z;
  
  return matrix;
}

// Rotate a matrix around an axis
export function rotateMatrix(matrix, angleInRadians, axis) {
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  
  const len = Math.sqrt(x * x + y * y + z * z);
  if (len < 0.000001) {
    return matrix;
  }
  
  x /= len;
  y /= len;
  z /= len;
  
  const s = Math.sin(angleInRadians);
  const c = Math.cos(angleInRadians);
  const t = 1 - c;
  
  const a00 = matrix[0];
  const a01 = matrix[1];
  const a02 = matrix[2];
  const a03 = matrix[3];
  const a10 = matrix[4];
  const a11 = matrix[5];
  const a12 = matrix[6];
  const a13 = matrix[7];
  const a20 = matrix[8];
  const a21 = matrix[9];
  const a22 = matrix[10];
  const a23 = matrix[11];
  
  // Construct the rotation matrix
  const b00 = x * x * t + c;
  const b01 = y * x * t + z * s;
  const b02 = z * x * t - y * s;
  const b10 = x * y * t - z * s;
  const b11 = y * y * t + c;
  const b12 = z * y * t + x * s;
  const b20 = x * z * t + y * s;
  const b21 = y * z * t - x * s;
  const b22 = z * z * t + c;
  
  // Multiply the matrices
  matrix[0] = a00 * b00 + a10 * b01 + a20 * b02;
  matrix[1] = a01 * b00 + a11 * b01 + a21 * b02;
  matrix[2] = a02 * b00 + a12 * b01 + a22 * b02;
  matrix[3] = a03 * b00 + a13 * b01 + a23 * b02;
  
  matrix[4] = a00 * b10 + a10 * b11 + a20 * b12;
  matrix[5] = a01 * b10 + a11 * b11 + a21 * b12;
  matrix[6] = a02 * b10 + a12 * b11 + a22 * b12;
  matrix[7] = a03 * b10 + a13 * b11 + a23 * b12;
  
  matrix[8] = a00 * b20 + a10 * b21 + a20 * b22;
  matrix[9] = a01 * b20 + a11 * b21 + a21 * b22;
  matrix[10] = a02 * b20 + a12 * b21 + a22 * b22;
  matrix[11] = a03 * b20 + a13 * b21 + a23 * b22;
  
  return matrix;
}

// Multiply two matrices
export function multiplyMatrices(a, b) {
  const result = [];
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i * 4 + k] * b[k * 4 + j];
      }
      result[i * 4 + j] = sum;
    }
  }
  
  return result;
}

// Invert a matrix
export function invertMatrix(matrix) {
  const result = [];
  
  const a00 = matrix[0];
  const a01 = matrix[1];
  const a02 = matrix[2];
  const a03 = matrix[3];
  const a10 = matrix[4];
  const a11 = matrix[5];
  const a12 = matrix[6];
  const a13 = matrix[7];
  const a20 = matrix[8];
  const a21 = matrix[9];
  const a22 = matrix[10];
  const a23 = matrix[11];
  const a30 = matrix[12];
  const a31 = matrix[13];
  const a32 = matrix[14];
  const a33 = matrix[15];
  
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  
  // Calculate the determinant
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  
  if (!det) {
    return null;
  }
  
  const invDet = 1.0 / det;
  
  result[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
  result[1] = (a02 * b10 - a01 * b11 - a03 * b09) * invDet;
  result[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
  result[3] = (a22 * b04 - a21 * b05 - a23 * b03) * invDet;
  result[4] = (a12 * b08 - a10 * b11 - a13 * b07) * invDet;
  result[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
  result[6] = (a32 * b02 - a30 * b05 - a33 * b01) * invDet;
  result[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
  result[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
  result[9] = (a01 * b08 - a00 * b10 - a03 * b06) * invDet;
  result[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
  result[11] = (a21 * b02 - a20 * b04 - a23 * b00) * invDet;
  result[12] = (a11 * b07 - a10 * b09 - a12 * b06) * invDet;
  result[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
  result[14] = (a31 * b01 - a30 * b03 - a32 * b00) * invDet;
  result[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;
  
  return result;
}