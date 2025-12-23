'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCheckoutREST, type CheckoutFormData } from '@/lib/hooks/useCheckoutREST';
import { useCartStore, type CartItem } from '@/lib/store/cartStore';
import { formatPrice } from '@/lib/utils/format';
import { calculateTotalShippingWeight } from '@/lib/utils/shipping';
import { ShippingRates } from '@/components/shipping/ShippingRates';
import type { ShippingAddress } from '@/lib/services/shipping';
import { validateCheckoutForm, validateShippingAddress, type ValidationError } from '@/lib/utils/validation';
import { CheckoutLoadingOverlay } from '@/components/checkout/CheckoutLoadingOverlay';
import { AddressSelector } from '@/components/checkout/AddressSelector';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { submitOrder, isProcessing, error } = useCheckoutREST();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    billingAddress1: '',
    billingAddress2: '',
    billingProvince: '',
    billingProvinceName: '',
    billingDistrict: '',
    billingDistrictName: '',
    billingWard: '',
    billingWardName: '',
    billingCity: '',
    billingPostcode: '',
    billingCountry: 'VN',
    shippingFirstName: '',
    shippingLastName: '',
    shippingAddress1: '',
    shippingAddress2: '',
    shippingProvince: '',
    shippingProvinceName: '',
    shippingDistrict: '',
    shippingDistrictName: '',
    shippingWard: '',
    shippingWardName: '',
    shippingCity: '',
    shippingPostcode: '',
    shippingCountry: 'VN',
    shippingMethod: 'flat_rate',
    paymentMethod: 'bacs',
    customerNote: '',
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null);

  // Redirect if cart is empty (use useEffect to avoid updating Router during render)
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  // Return null if cart is empty (while redirecting)
  if (items.length === 0) {
    return null;
  }

  const totalPrice = getTotalPrice();
  const shippingWeight = calculateTotalShippingWeight(
    items.map((item: CartItem) => ({
      quantity: item.quantity,
      product: {
        weight: item.weight,
        productSpecs: {
          length: item.length,
          width: item.width,
          height: item.height,
          volumetricWeight: item.volumetricWeight,
        },
      },
    }))
  );

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateCheckoutForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Scroll to first error
      const firstErrorField = validation.errors[0]?.field;
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Validate shipping address if needed
    const shippingAddress: ShippingAddress = sameAsBilling
      ? {
          province: formData.billingProvinceName || formData.billingCity,
          district: formData.billingDistrictName || formData.billingCity,
          address: formData.billingAddress1,
        }
      : {
          province: formData.shippingProvinceName || formData.shippingCity || formData.billingProvinceName || formData.billingCity,
          district: formData.shippingDistrictName || formData.shippingCity || formData.billingDistrictName || formData.billingCity,
          address: formData.shippingAddress1 || formData.billingAddress1,
        };

    const shippingValidation = validateShippingAddress(shippingAddress);
    if (!shippingValidation.isValid) {
      setValidationErrors(shippingValidation.errors);
      // Scroll to shipping address section
      document.querySelector('[data-step="2"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setCurrentStep(2);
      return;
    }

    setValidationErrors([]);
    
    // Calculate totals
    const subtotal = getTotalPrice();
    const shippingTotal = selectedShippingRate?.cost || 0;
    const total = subtotal + shippingTotal;
    
    const result = await submitOrder(formData, items, subtotal, shippingTotal, total);
    
    if (result) {
      // Clear cart after successful order
      clearCart();
      
      // Redirect to order confirmation page
      router.push(`/order-confirmation?orderId=${result.orderId}&paymentMethod=${formData.paymentMethod}&total=${totalPrice}`);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="container-mobile py-8 md:py-16">
      <h1 className="font-heading text-2xl md:text-3xl mb-6">
        Thanh toán
      </h1>

      {/* Loading Overlay */}
      {isProcessing && <CheckoutLoadingOverlay />}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Customer Information */}
            {currentStep === 1 && (
              <Card className="p-6">
                <h2 className="font-heading text-xl font-semibold mb-4">
                  Thông tin khách hàng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">
                      Họ *
                    </label>
                    <Input
                      required
                      name="firstName"
                      value={formData.firstName}
                      onChange={(e) => {
                        handleInputChange('firstName', e.target.value);
                        setValidationErrors((prev) => prev.filter((err) => err.field !== 'firstName'));
                      }}
                      placeholder="Nhập họ"
                      className={validationErrors.some((err) => err.field === 'firstName') ? 'border-destructive' : ''}
                    />
                    {validationErrors.some((err) => err.field === 'firstName') && (
                      <p className="text-xs text-destructive mt-1">
                        {validationErrors.find((err) => err.field === 'firstName')?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">
                      Tên *
                    </label>
                    <Input
                      required
                      name="lastName"
                      value={formData.lastName}
                      onChange={(e) => {
                        handleInputChange('lastName', e.target.value);
                        setValidationErrors((prev) => prev.filter((err) => err.field !== 'lastName'));
                      }}
                      placeholder="Nhập tên"
                      className={validationErrors.some((err) => err.field === 'lastName') ? 'border-destructive' : ''}
                    />
                    {validationErrors.some((err) => err.field === 'lastName') && (
                      <p className="text-xs text-destructive mt-1">
                        {validationErrors.find((err) => err.field === 'lastName')?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={(e) => {
                        handleInputChange('email', e.target.value);
                        setValidationErrors((prev) => prev.filter((err) => err.field !== 'email'));
                      }}
                      placeholder="email@example.com"
                      className={validationErrors.some((err) => err.field === 'email') ? 'border-destructive' : ''}
                    />
                    {validationErrors.some((err) => err.field === 'email') && (
                      <p className="text-xs text-destructive mt-1">
                        {validationErrors.find((err) => err.field === 'email')?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">
                      Số điện thoại *
                    </label>
                    <Input
                      type="tel"
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        handleInputChange('phone', e.target.value);
                        setValidationErrors((prev) => prev.filter((err) => err.field !== 'phone'));
                      }}
                      placeholder="0123456789"
                      className={validationErrors.some((err) => err.field === 'phone') ? 'border-destructive' : ''}
                    />
                    {validationErrors.some((err) => err.field === 'phone') && (
                      <p className="text-xs text-destructive mt-1">
                        {validationErrors.find((err) => err.field === 'phone')?.message}
                      </p>
                    )}
                  </div>
                </div>
                <Button type="button" onClick={nextStep} className="mt-6 w-full md:w-auto">
                  Tiếp tục
                </Button>
              </Card>
            )}

            {/* Step 2: Shipping Address */}
            {currentStep === 2 && (
              <Card className="p-6" data-step="2">
                <h2 className="font-heading text-xl font-semibold mb-4">
                  Địa chỉ giao hàng
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => setSameAsBilling(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-text-muted">
                        Sử dụng địa chỉ thanh toán làm địa chỉ giao hàng
                      </span>
                    </label>
                  </div>

                  {/* Shipping Rates */}
                  <ShippingRates
                    address={
                      sameAsBilling
                        ? {
                            province: formData.billingProvinceName || formData.billingCity,
                            district: formData.billingDistrictName || formData.billingCity,
                            address: formData.billingAddress1,
                          }
                        : {
                            province: formData.shippingProvinceName || formData.shippingCity || formData.billingProvinceName || formData.billingCity,
                            district: formData.shippingDistrictName || formData.shippingCity || formData.billingDistrictName || formData.billingCity,
                            address: formData.shippingAddress1 || formData.billingAddress1,
                          }
                    }
                    selectedRateId={selectedShippingRate?.id}
                    onSelectRate={(rate) => {
                      setSelectedShippingRate(rate);
                      handleInputChange('shippingMethod', `${rate.provider}-${rate.service}`);
                    }}
                  />

                  {!sameAsBilling && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
                          Họ
                        </label>
                        <Input
                          value={formData.shippingFirstName}
                          onChange={(e) => handleInputChange('shippingFirstName', e.target.value)}
                          placeholder="Nhập họ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
                          Tên
                        </label>
                        <Input
                          value={formData.shippingLastName}
                          onChange={(e) => handleInputChange('shippingLastName', e.target.value)}
                          placeholder="Nhập tên"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">
                      Địa chỉ *
                    </label>
                    <Input
                      required
                      name="billingAddress1"
                      value={formData.billingAddress1}
                      onChange={(e) => {
                        handleInputChange('billingAddress1', e.target.value);
                        setValidationErrors((prev) => prev.filter((err) => err.field !== 'billingAddress1'));
                      }}
                      placeholder="Số nhà, tên đường"
                      className={validationErrors.some((err) => err.field === 'billingAddress1') ? 'border-destructive' : ''}
                    />
                    {validationErrors.some((err) => err.field === 'billingAddress1') && (
                      <p className="text-xs text-destructive mt-1">
                        {validationErrors.find((err) => err.field === 'billingAddress1')?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">
                      Địa chỉ 2 (tùy chọn)
                    </label>
                    <Input
                      value={formData.billingAddress2}
                      onChange={(e) => handleInputChange('billingAddress2', e.target.value)}
                      placeholder="Số nhà, tòa nhà, căn hộ..."
                    />
                  </div>
                  
                  {/* Address Selector: Tỉnh/Thành, Quận/Huyện, Phường/Xã */}
                  <AddressSelector
                    province={formData.billingProvince}
                    district={formData.billingDistrict}
                    ward={formData.billingWard}
                    onProvinceChange={(cityId, cityName) => {
                      handleInputChange('billingProvince', cityId);
                      handleInputChange('billingProvinceName', cityName);
                      handleInputChange('billingCity', cityName); // Keep for backward compatibility
                      setValidationErrors((prev) => prev.filter((err) => err.field !== 'billingProvince' && err.field !== 'billingCity' && err.field !== 'province'));
                    }}
                    onDistrictChange={(districtId, districtName) => {
                      handleInputChange('billingDistrict', districtId);
                      handleInputChange('billingDistrictName', districtName);
                      setValidationErrors((prev) => prev.filter((err) => err.field !== 'billingDistrict' && err.field !== 'district'));
                    }}
                    onWardChange={(wardId, wardName) => {
                      handleInputChange('billingWard', wardId);
                      handleInputChange('billingWardName', wardName);
                      setValidationErrors((prev) => prev.filter((err) => err.field !== 'billingWard' && err.field !== 'ward'));
                    }}
                    error={validationErrors.find((err) => err.field === 'billingProvince' || err.field === 'billingDistrict' || err.field === 'billingWard' || err.field === 'province' || err.field === 'district' || err.field === 'ward')?.message}
                    required
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-main mb-2">
                        Mã bưu điện *
                      </label>
                      <Input
                        required
                        name="billingPostcode"
                        value={formData.billingPostcode}
                        onChange={(e) => {
                          handleInputChange('billingPostcode', e.target.value);
                          setValidationErrors((prev) => prev.filter((err) => err.field !== 'billingPostcode'));
                        }}
                        placeholder="100000"
                        className={validationErrors.some((err) => err.field === 'billingPostcode') ? 'border-destructive' : ''}
                      />
                      {validationErrors.some((err) => err.field === 'billingPostcode') && (
                        <p className="text-xs text-destructive mt-1">
                          {validationErrors.find((err) => err.field === 'billingPostcode')?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-main mb-2">
                        Quốc gia *
                      </label>
                      <Select
                        value={formData.billingCountry}
                        onValueChange={(value) => handleInputChange('billingCountry', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn quốc gia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VN">Việt Nam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {/* Shipping Rates */}
                <div className="mt-6">
                  <h3 className="font-heading text-lg font-semibold mb-4">
                    Phương thức vận chuyển
                  </h3>
                  <ShippingRates
                    address={
                      sameAsBilling
                        ? {
                            province: formData.billingProvinceName || formData.billingCity,
                            district: formData.billingDistrictName || formData.billingCity,
                            address: formData.billingAddress1,
                          }
                        : {
                            province: formData.shippingProvinceName || formData.shippingCity || formData.billingProvinceName || formData.billingCity,
                            district: formData.shippingDistrictName || formData.shippingCity || formData.billingDistrictName || formData.billingCity,
                            address: formData.shippingAddress1 || formData.billingAddress1,
                          }
                    }
                    selectedRateId={selectedShippingRate?.id}
                    onSelectRate={(rate) => {
                      setSelectedShippingRate(rate);
                      handleInputChange('shippingMethod', `${rate.provider}-${rate.service}`);
                    }}
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Quay lại
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Tiếp tục
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Payment & Review */}
            {currentStep === 3 && (
              <Card className="p-6">
                <h2 className="font-heading text-xl font-semibold mb-4">
                  Phương thức thanh toán
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bacs"
                        checked={formData.paymentMethod === 'bacs'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">Chuyển khoản ngân hàng</span>
                        <p className="text-sm text-text-muted">
                          Chuyển khoản qua VietQR hoặc số tài khoản ngân hàng
                        </p>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                        <p className="text-sm text-text-muted">
                          Thanh toán bằng tiền mặt khi nhận hàng. Có thể phát sinh phí COD.
                        </p>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                        <p className="text-sm text-text-muted">
                          Thanh toán bằng tiền mặt khi nhận hàng
                        </p>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="momo"
                        checked={formData.paymentMethod === 'momo'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">Ví MoMo</span>
                        <p className="text-sm text-text-muted">
                          Thanh toán qua ứng dụng MoMo
                        </p>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={formData.paymentMethod === 'bank_transfer'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">Chuyển khoản ngân hàng (thủ công)</span>
                        <p className="text-sm text-text-muted">
                          Chuyển khoản và upload ảnh chứng từ. Shop sẽ xác nhận trong 1-2 ngày.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Ghi chú đơn hàng (tùy chọn)
                  </label>
                  <textarea
                    className="w-full min-h-[100px] rounded-full border border-input bg-background px-4 py-2 text-[15px]"
                    value={formData.customerNote}
                    onChange={(e) => handleInputChange('customerNote', e.target.value)}
                    placeholder="Ghi chú cho đơn hàng của bạn..."
                  />
                </div>

                {error && (
                  <div className="mt-4 bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Quay lại
                  </Button>
                  <Button type="submit" disabled={isProcessing} className="flex-1">
                    {isProcessing ? 'Đang xử lý...' : 'Đặt hàng'}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="font-heading text-xl font-semibold mb-4">
                Đơn hàng của bạn
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={item.image || '/images/teddy-placeholder.png'}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{item.productName}</p>
                      <p className="text-xs text-text-muted">
                        Số lượng: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Tạm tính:</span>
                  <span className="font-medium">{formatPrice(totalPrice.toString())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Cân nặng vận chuyển:</span>
                  <span className="font-medium">{shippingWeight.toFixed(2)} kg</span>
                </div>
                {selectedShippingRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Phí vận chuyển:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(selectedShippingRate.cost)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary text-lg">
                    {formatPrice(
                      (
                        totalPrice +
                        (selectedShippingRate?.cost || 0)
                      ).toString()
                    )}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

