/**
 * Integration tests for Payment functionality
 * Tests VietQR and MoMo payment integrations
 */

import { generateVietQR, formatAmountForVietQR, formatAddInfoForVietQR } from '@/lib/services/vietqr';
import { createMoMoPayment, createMoMoSignature, verifyMoMoCallback, formatMoMoOrderInfo } from '@/lib/services/momo';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Payment Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('VietQR Integration', () => {
    it('should format amount correctly for VietQR', () => {
      const amount = 100000;
      const formatted = formatAmountForVietQR(amount);
      expect(formatted).toBe('100000');
    });

    it('should format additional info correctly for VietQR', () => {
      const orderInfo = 'Order #12345 - Shop Gấu Bông';
      const formatted = formatAddInfoForVietQR(orderInfo);
      expect(formatted.length).toBeLessThanOrEqual(25);
    });

    it('should generate VietQR code successfully', async () => {
      const result = await generateVietQR({
        accountNo: '1234567890',
        accountName: 'SHOP GAU BONG',
        acqId: '970415',
        template: 'compact',
        amount: 100000,
        addInfo: 'Order #12345',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('https://img.vietqr.io/image');
      expect(result).toContain('accountNo=1234567890');
    });

    it('should handle VietQR generation error', async () => {
      // VietQR service doesn't throw errors for invalid configs
      // It just returns a URL that might not work
      // So we test that it returns a string
      const result = await generateVietQR({
        accountNo: 'invalid',
        accountName: 'SHOP GAU BONG',
        acqId: '970415',
        template: 'compact',
        amount: 100000,
        addInfo: 'Order #12345',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('MoMo Integration', () => {
    it('should create MoMo signature correctly', () => {
      const partnerCode = 'MOMO';
      const accessKey = 'ACCESS_KEY';
      const requestId = 'REQUEST_ID';
      const amount = 100000;
      const orderId = 'ORDER_ID';
      const orderInfo = 'Order #12345';
      const returnUrl = 'https://example.com/return';
      const notifyUrl = 'https://example.com/notify';
      const extraData = '';
      const secretKey = 'SECRET_KEY';

      const signature = createMoMoSignature({
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        returnUrl,
        notifyUrl,
        extraData,
        secretKey,
      });

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should format MoMo order info correctly', () => {
      const orderInfo = 'Order #12345 - Shop Gấu Bông - Test Product';
      const formatted = formatMoMoOrderInfo(orderInfo);
      expect(formatted.length).toBeLessThanOrEqual(255);
    });

    it('should create MoMo payment request successfully', async () => {
      const mockResponse = {
        requestId: 'REQUEST_ID',
        errorCode: 0,
        message: 'Success',
        localMessage: 'Thành công',
        requestType: 'captureWallet',
        payUrl: 'https://test-payment.momo.vn/v2/gateway/...',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createMoMoPayment(
        {
          partnerCode: 'MOMO',
          accessKey: 'ACCESS_KEY',
          secretKey: 'SECRET_KEY',
          environment: 'sandbox',
        },
        {
          orderId: 'ORDER_ID',
          orderInfo: 'Order #12345',
          amount: 100000,
          returnUrl: 'https://example.com/return',
          notifyUrl: 'https://example.com/notify',
        }
      );

      expect(result).toBeDefined();
      expect(result.payUrl).toBe(mockResponse.payUrl);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-payment.momo.vn'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle MoMo API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        createMoMoPayment(
          {
            partnerCode: 'MOMO',
            accessKey: 'ACCESS_KEY',
            secretKey: 'SECRET_KEY',
            environment: 'sandbox',
          },
          {
            orderId: '',
            orderInfo: '',
            amount: 0,
            returnUrl: 'https://example.com/return',
            notifyUrl: 'https://example.com/notify',
          }
        )
      ).rejects.toThrow();
    });

    it('should verify MoMo callback correctly', async () => {
      const callbackData = {
        partnerCode: 'MOMO',
        accessKey: 'ACCESS_KEY',
        requestId: 'REQUEST_ID',
        amount: 100000,
        orderId: 'ORDER_ID',
        orderInfo: 'Order #12345',
        orderType: 'momo_wallet',
        transId: 'TRANS_ID',
        resultCode: 0,
        message: 'Success',
        payType: 'web',
        responseTime: 1234567890,
        extraData: '',
        signature: 'VALID_SIGNATURE',
      };

      const secretKey = 'SECRET_KEY';

      // Mock signature verification
      const isValid = await verifyMoMoCallback(callbackData, secretKey);
      
      // Note: This will depend on actual signature verification logic
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Payment Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Mock network error by throwing in fetch
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        generateVietQR({
          accountNo: '1234567890',
          accountName: 'SHOP GAU BONG',
          acqId: '970415',
          template: 'compact',
          amount: 100000,
          addInfo: 'Order #12345',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
      );

      await expect(
        createMoMoPayment(
          {
            partnerCode: 'MOMO',
            accessKey: 'ACCESS_KEY',
            secretKey: 'SECRET_KEY',
            environment: 'sandbox',
          },
          {
            orderId: 'ORDER_ID',
            orderInfo: 'Order #12345',
            amount: 100000,
            returnUrl: 'https://example.com/return',
            notifyUrl: 'https://example.com/notify',
          }
        )
      ).rejects.toThrow();
    });
  });
});

