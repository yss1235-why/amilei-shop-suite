# Amilei E-Commerce Setup Guide

## 🚀 Quick Start

### 1. Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Enable Google Analytics (optional)

2. **Get Firebase Config**
   - In your Firebase project, go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Register your app and copy the configuration

3. **Add Firebase Config to Your App**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 2. Enable Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode**
4. Select a location and click "Enable"

### 3. Set Up Firestore Security Rules

In Firestore Database, go to the **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is an active admin
    function isActiveAdmin() {
      let admin = get(/databases/$(database)/documents/admins/$(request.auth.uid));
      return request.auth != null 
        && admin.data.isActive == true 
        && admin.data.subscriptionExpiry > request.time;
    }
    
    // Products - public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if isActiveAdmin();
    }
    
    // Orders - public read/create, admin update
    match /orders/{orderId} {
      allow read: if true;
      allow create: if true;
      allow update: if isActiveAdmin();
    }
    
    // Settings - public read, admin write
    match /settings/{settingId} {
      allow read: if true;
      allow write: if isActiveAdmin();
    }
    
    // Admins - only admins can read
    match /admins/{adminId} {
      allow read: if isActiveAdmin();
      allow write: if false; // Manually manage admins
    }
    
    // Invoices - admin only
    match /invoices/{invoiceId} {
      allow read, write: if isActiveAdmin();
    }
  }
}
```

### 4. Enable Google Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Click on **Google** provider
5. Toggle "Enable"
6. Add your support email
7. Click "Save"

### 5. Create Admin User

1. In Firestore Database, create a collection called `admins`
2. Add a document with your Google Account UID as the document ID:
   ```json
   {
     "email": "your-email@gmail.com",
     "name": "Your Name",
     "whatsappNumber": "919876543210",
     "subscriptionExpiry": [Set to 1 month from now],
     "isActive": true
   }
   ```

**To find your UID:**
- Sign in once through the app at `/admin`
- Go to Firebase Console → Authentication → Users
- Copy your UID from the list

### 6. Initialize Store Settings

1. In Firestore, create a collection called `settings`
2. Add a document with ID `store`:
   ```json
   {
     "storeName": "Amilei",
     "whatsappNumber": "919876543210",
     "courierCharges": 100,
     "freeShippingThreshold": 2000,
     "gstMessage": "GST not included"
   }
   ```

### 7. Add Sample Products (Optional)

Add documents to the `products` collection:

```json
{
  "name": "Sample Product",
  "description": "This is a sample product description",
  "price": 999,
  "salePrice": 799,
  "discountPercent": 20,
  "imageUrl": "https://via.placeholder.com/500",
  "stockCount": 50,
  "inStock": true,
  "isFeatured": true
}
```

## 📱 Testing the Application

### Customer Flow
1. Browse products at `/`
2. Add items to cart
3. Proceed to checkout (creates order and opens WhatsApp)
4. View order details at `/order/[orderId]`

### Admin Flow
1. Sign in at `/admin` with Google
2. View dashboard at `/admin/dashboard`
3. Manage products at `/admin/products`
4. Configure settings at `/admin/settings`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🎨 Cloudinary Integration (Optional)

For image uploads in the admin panel:

1. Create a [Cloudinary account](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret
3. Integrate Cloudinary widget in `AdminProductForm.tsx`
4. Update the upload button functionality

## 📞 WhatsApp Integration

Make sure your WhatsApp number in settings:
- Includes country code
- No + symbol
- Example: `919876543210` for India

## 🚨 Troubleshooting

### "Unauthorized access" error
- Ensure your Google email is added to the `admins` collection
- Check that `subscriptionExpiry` is in the future
- Verify `isActive` is set to `true`

### Products not showing
- Check Firestore security rules are published
- Verify products collection has documents
- Check browser console for errors

### WhatsApp not opening
- Verify `whatsappNumber` in settings is correct format
- Test the number format: country code without +

## 📚 Next Steps

- Integrate Cloudinary for image uploads
- Add invoice generation functionality
- Set up automated order expiration (30 days)
- Configure backup and monitoring
- Add analytics tracking

## 🆘 Support

For issues or questions:
1. Check Firebase Console logs
2. Review browser console errors
3. Verify all environment variables
4. Ensure Firestore rules are correct
