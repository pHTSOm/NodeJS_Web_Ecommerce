import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartItems: [],
  totalAmount: 0,
  totalQuantity: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action) => {
      const newItem = action.payload;
      console.log("Before URL fix - Item being added to cart:", newItem);
      
      if (newItem.imgUrl && !newItem.imgUrl.startsWith('http')) {
        newItem.imgUrl = `http://localhost:5000${newItem.imgUrl}`;
        console.log("After URL fix - Updated image URL:", newItem.imgUrl);
      }

      // Generate a unique cart item key using product ID and variant ID (if exists)
      // This is the key fix for the variant issue
      const variantId = newItem.variant ? newItem.variant.id : 'default';
      const cartItemKey = `${newItem.id}-${variantId}`;
      
      // Check if this exact product + variant combination exists in cart
      const existingItemIndex = state.cartItems.findIndex(
        (item) => {
          const itemVariantId = item.variant ? item.variant.id : 'default';
          return item.id === newItem.id && itemVariantId === variantId;
        }
      );
      
      if (existingItemIndex >= 0) {
        // Same product + variant exists, just update quantity
        state.cartItems[existingItemIndex].quantity += newItem.quantity || 1;
      } else {
        // Different product or different variant, add as new item
        newItem.quantity = newItem.quantity || 1;
        // Store the cartItemKey for later use (optional)
        newItem.cartItemKey = cartItemKey;
        state.cartItems.push(newItem);
      }
      
      // Update totals
      state.totalQuantity = state.cartItems.reduce(
        (total, item) => total + item.quantity, 
        0
      );
      
      state.totalAmount = state.cartItems.reduce(
        (total, item) => total + Number(item.price) * Number(item.quantity),
        0
      );
    },
    
    deleteItem: (state, action) => {
      const id = action.payload;
      const existingItemIndex = state.cartItems.findIndex(
        (item) => item.id === id
      );
      
      if (existingItemIndex >= 0) {
        const itemToDelete = state.cartItems[existingItemIndex];
        
        // Subtract the price and quantity of this item
        state.totalQuantity -= itemToDelete.quantity;
        state.totalAmount -= itemToDelete.price * itemToDelete.quantity;
        
        // Remove the item from the cart
        state.cartItems.splice(existingItemIndex, 1);
      }
    },

    // Updated delete function to handle variants
    deleteCartItem: (state, action) => {
      const { productId, variantId } = action.payload;
      const variantIdToCheck = variantId || 'default';
      
      const existingItemIndex = state.cartItems.findIndex(
        (item) => {
          const itemVariantId = item.variant ? item.variant.id : 'default';
          return item.id === productId && itemVariantId === variantIdToCheck;
        }
      );
      
      if (existingItemIndex >= 0) {
        const itemToDelete = state.cartItems[existingItemIndex];
        
        // Subtract the price and quantity of this item
        state.totalQuantity -= itemToDelete.quantity;
        state.totalAmount -= itemToDelete.price * itemToDelete.quantity;
        
        // Remove the item from the cart
        state.cartItems.splice(existingItemIndex, 1);
      }
    },
    
    // Add quantity controls 
    incrementQuantity: (state, action) => {
      const id = action.payload;
      const item = state.cartItems.find(item => item.id === id);
      if (item) {
        item.quantity++;
        state.totalQuantity++;
        state.totalAmount += Number(item.price);
      }
    },
    
    decrementQuantity: (state, action) => {
      const id = action.payload;
      const item = state.cartItems.find(item => item.id === id);
      if (item && item.quantity > 1) {
        item.quantity--;
        state.totalQuantity--;
        state.totalAmount -= Number(item.price);
      }
    },
    
    // Better increment/decrement that handles variants
    incrementItemQuantity: (state, action) => {
      const { productId, variantId } = action.payload;
      const variantIdToCheck = variantId || 'default';
      
      const item = state.cartItems.find(item => {
        const itemVariantId = item.variant ? item.variant.id : 'default';
        return item.id === productId && itemVariantId === variantIdToCheck;
      });
      
      if (item) {
        item.quantity++;
        state.totalQuantity++;
        state.totalAmount += Number(item.price);
      }
    },
    
    decrementItemQuantity: (state, action) => {
      const { productId, variantId } = action.payload;
      const variantIdToCheck = variantId || 'default';
      
      const item = state.cartItems.find(item => {
        const itemVariantId = item.variant ? item.variant.id : 'default';
        return item.id === productId && itemVariantId === variantIdToCheck;
      });
      
      if (item && item.quantity > 1) {
        item.quantity--;
        state.totalQuantity--;
        state.totalAmount -= Number(item.price);
      }
    },
    
    clearCart: (state) => {
      state.cartItems = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
    }
  }
});

export const cartActions = cartSlice.actions;

export default cartSlice.reducer;