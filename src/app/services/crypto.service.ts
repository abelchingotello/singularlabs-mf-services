import { Injectable } from '@angular/core';
import { VariablesService } from './variables.service';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  private keySize: number = 256; // 256-bit key
  private publicKeyRSA: string =
    `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr4o5VxhQ3lzkmsafWPgg
+LOy5ZWx3PupvSk5MNazWFB08kIDchJnnVvV+1oaKl04aBySY5jRtfxm7meuCY5j
FsmI7HbGoUsbBGyxnFWDHl4rVMjMMvUtozxykPRU46htkrB8SsPrWda4Q883Fxui
N6Hznra9ppFVNlJ/aJ+OJIAc0W6IPqhP1UWz56gpRlymYVYOBjdeepdZHcFTcE2Q
rnuTjZpIHHlsn2SiWby8dnsMEXEWXNuZOXDE+Bo3WV6UEdZ7X18Uq+DSoRY0XmQJ
KMjAKQwp7P+4PLf+acuM4brHBzqq5b975BaSJUe5Fl6R2jHwe8cU8DZBezS15yCP
IwIDAQAB
-----END PUBLIC KEY-----`;

  constructor() {
    // Cargar la clave pública RSA del servicio de variables
    //this.publicKeyRSA = this.variables.getConfig('rsa_public_key');
  }

  // 1. Generar una clave AES aleatoria (AES-256-GCM)
  async generateRandomAESKey(): Promise<CryptoKey> {
    try {
      const aesKey = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',  // Modo de operación AES-GCM
          length: this.keySize,  // Longitud de 256 bits
        },
        true,  // La clave es exportable
        ['encrypt', 'decrypt']  // Permitir cifrado y descifrado
      );

      // Verificar la longitud de la clave AES
      const aesKeyBuffer = await window.crypto.subtle.exportKey('raw', aesKey);
      if (aesKeyBuffer.byteLength !== 32) {
        throw new Error(`Tamaño incorrecto de la clave AES generada: ${aesKeyBuffer.byteLength} bytes. Se esperaban 32 bytes.`);
      }

      return aesKey;
    } catch (error) {
      console.error('Error generando la clave AES:', error);
      throw error;
    }
  }

  // 2. Cifrar los datos con la clave AES generada
  async encryptDataWithAES(data: any, aesKey: CryptoKey): Promise<{ encryptedData: ArrayBuffer, iv: Uint8Array }> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);  // Convertir los datos a binario

    const iv = window.crypto.getRandomValues(new Uint8Array(12));  // Generar un IV aleatorio de 12 bytes

    // Cifrar los datos con AES-GCM usando la clave AES y el IV
    let encryptedData;
    try {
      encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        aesKey,
        encodedData
      );
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
    return { encryptedData, iv };  // Retornar los datos cifrados y el IV
  }

  // 3. Cifrar la clave AES con la clave pública RSA
  async encryptAESKeyWithRSA(aesKey: CryptoKey): Promise<ArrayBuffer> {
    // Convert the RSA public key from PEM to ArrayBuffer
    const publicKeyArrayBuffer = await this.pemToArrayBuffer(this.publicKeyRSA);

    // Import the RSA public key
    const algorithm = {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' }
    };
    const importedPublicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyArrayBuffer,  // Public key in ArrayBuffer format
      algorithm,
      false,
      ['encrypt']  // Only allow encryption with this key
    );

    // Export the AES key to be encrypted
    const exportedAESKey = await window.crypto.subtle.exportKey('raw', aesKey);

    // Encrypt the AES key with the RSA public key
    return await window.crypto.subtle.encrypt(
      algorithm,
      importedPublicKey,  // Imported RSA public key
      exportedAESKey  // Exported AES key in binary format
    );
  }

  // 4. Método principal para cifrar datos
  async encryptedAES(data: any): Promise<{ encryptedData: string, encryptedKeyAES: string, iv: string }> {
    // Generar una clave AES
    const aesKey = await this.generateRandomAESKey();

    //Cifrar los datos usando la clave AES
    const { encryptedData, iv } = await this.encryptDataWithAES(data, aesKey);

    //Cifrar la clave AES con la clave pública RSA
    const encryptedAESKey = await this.encryptAESKeyWithRSA(aesKey);

    // Convertir los resultados a Base64 para enviar al backend
    const encryptedDataBase64 = this.arrayBufferToBase64(encryptedData);
    const encryptedAESKeyBase64 = this.arrayBufferToBase64(encryptedAESKey);
    const ivBase64 = this.arrayBufferToBase64(iv);
    // Retornar los datos cifrados, la clave AES cifrada y el IV en formato Base64
    return {
      encryptedData: encryptedDataBase64,
      encryptedKeyAES: encryptedAESKeyBase64,
      iv: ivBase64,
    };
  }

  // Convertir PEM (clave pública RSA) a ArrayBuffer
  private async pemToArrayBuffer(pem: string): Promise<ArrayBuffer> {
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem
      .replace(pemHeader, '')  // Eliminar el encabezado
      .replace(pemFooter, '')  // Eliminar el pie
      .replace(/\s/g, '');     // Eliminar cualquier espacio o salto de línea

    try {
      const binaryDerString = window.atob(pemContents);  // Decodificar base64 a binario
      const binaryDer = new Uint8Array(binaryDerString.length);
      for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
      }
      return binaryDer.buffer;
    } catch (error) {
      console.error('Error decodificando la clave PEM:', error);
      throw error;
    }
  }

  // Convertir ArrayBuffer a Base64 para enviar datos al backend
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}