const Order = require('../models/Order');
const User = require('../models/User');

/* ─────────────────────────────────────────
   SHIPPING CHARGE CALCULATION
───────────────────────────────────────── */
exports.calculateRates = async (req, res) => {
  try {
    const { destinationCountry = 'India', weightKg = 1, orderValue = 0 } = req.body;
    
    // Simulate real-time API integrations with shipping partners
    const partners = [];

    if (destinationCountry.toLowerCase() === 'india') {
      // Domestic Logistics
      if (orderValue >= 499) {
        partners.push({ partner: 'Pustakly Standard', cost: 0, estimatedDays: 5, type: 'Economy' });
      } else {
        partners.push({ partner: 'Pustakly Standard', cost: 49, estimatedDays: 5, type: 'Economy' });
      }
      partners.push({ partner: 'Delhivery', cost: 65 + (weightKg * 10), estimatedDays: 3, type: 'Standard' });
      partners.push({ partner: 'Shiprocket', cost: 75 + (weightKg * 12), estimatedDays: 2, type: 'Express' });
    } else {
      // International Logistics
      partners.push({ partner: 'FedEx', cost: 1500 + (weightKg * 500), estimatedDays: 7, type: 'International Express' });
      partners.push({ partner: 'DHL', cost: 1200 + (weightKg * 450), estimatedDays: 10, type: 'International Economy' });
    }

    return res.json({ success: true, rates: partners });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   LOGISTICS API INTEGRATION (Mock)
───────────────────────────────────────── */
exports.assignPartner = async (req, res) => {
  try {
    const { partner } = req.body;
    const orderId = req.params.orderId;
    
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Forbidden. Only admins can assign partners.' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Generate tracking ID
    const trackingPrefix = {
      'Delhivery': 'DLV',
      'Shiprocket': 'SHP',
      'FedEx': 'FDX',
      'DHL': 'DHL'
    }[partner] || 'TRK';

    const trackingId = `${trackingPrefix}${Date.now().toString().slice(-8)}`;

    order.courierPartner = partner;
    order.trackingId = trackingId;
    order.status = 'Shipped';
    
    // Set Estimated Delivery Date based on partner
    const estDays = ['FedEx', 'DHL'].includes(partner) ? 10 : 3;
    const date = new Date();
    date.setDate(date.getDate() + estDays);
    order.estimatedDeliveryDate = date;

    // Add tracking history event
    order.trackingHistory.push({
      status: 'Shipped',
      location: 'Fulfillment Center',
      message: `Package picked up by ${partner}`
    });

    await order.save();
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.generateLabel = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.trackingId) {
      return res.status(400).json({ message: 'Assign a courier partner first to generate label' });
    }

    // Mock PDF URL Generation
    const url = `https://cdn.pustakly.com/labels/${order.trackingId}.pdf`;
    order.shippingLabelUrl = url;
    await order.save();

    return res.json({ success: true, url });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const order = await Order.findOne({ trackingId });
    
    if (!order) {
      return res.status(404).json({ message: 'Invalid Tracking ID' });
    }

    return res.json({
      trackingId: order.trackingId,
      partner: order.courierPartner,
      status: order.status,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      history: order.trackingHistory
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   ADDRESS MANAGEMENT (Multiple Addresses)
───────────────────────────────────────── */
exports.getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.json({ success: true, addresses: user.addresses || [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.addUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const newAddress = req.body;
    
    if (newAddress.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    return res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(addressId);
    
    if (!address) return res.status(404).json({ message: 'Address not found' });

    if (req.body.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    Object.assign(address, req.body);
    await user.save();

    return res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    user.addresses.pull({ _id: addressId });
    await user.save();
    return res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
