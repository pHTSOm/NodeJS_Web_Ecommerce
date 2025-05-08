import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { CartService } from "../services/api";
import API from "../services/api";

// Async thunks for cart operations
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/cart');
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch cart' });
    }
  }
);

export const addItemToCart = createAsyncThunk(
  'cart/addItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await API.post('/cart/items', itemData);
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to add item' });
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateItemQuantity',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/cart/items/${itemId}`, { quantity });
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update item' });
    }
  }
);

export const syncCartAfterLogin = createAsyncThunk(
  'cart/syncAfterLogin',
  async (_, { rejectWithValue }) => {
    try {
      // Try to associate any guest cart with the logged-in user
      const response = await CartService.associateCart();
      
      // After association, get the cart (which should now be the user's cart)
      const cartResponse = await CartService.getCart();
      return cartResponse.cart;
    } catch (error) {
      console.error('Cart sync error:', error);
      return rejectWithValue({ 
        message: error.response?.data?.message || 'Server error'
      });
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/cart/items/${itemId}`);
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to remove item' });
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.delete('/cart/clear');
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to clear cart' });
    }
  }
);

const initialState = {
  cartItems: [],
  totalAmount: 0,
  totalQuantity: 0,
  loading: false,
  error: null,
  cartId: null
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
    
    clearCartLocal: (state) => {
      state.cartItems = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
    }
  },

  extraReducers: (builder) => {
    // Handle fetchCart
    builder.addCase(fetchCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cartItems = action.payload.items;
      state.totalAmount = action.payload.totalAmount;
      state.totalQuantity = action.payload.totalQuantity;
      state.cartId = action.payload.id;
    });
    builder.addCase(fetchCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Failed to fetch cart';
    });

    // Handle syncCartAfterLogin
    builder.addCase(syncCartAfterLogin.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(syncCartAfterLogin.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.cartItems = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      }
    });
    builder.addCase(syncCartAfterLogin.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Failed to sync cart';
      // Don't clear the cart on sync failure - keep existing items
    });
    
    // Handle addItemToCart
    builder.addCase(addItemToCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addItemToCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cartItems = action.payload.items;
      state.totalAmount = action.payload.totalAmount;
      state.totalQuantity = action.payload.totalQuantity;
      state.cartId = action.payload.id;
    });
    builder.addCase(addItemToCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Failed to add item';
    });
    // Handle updateCartItemQuantity
    builder.addCase(updateCartItemQuantity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCartItemQuantity.fulfilled, (state, action) => {
      state.loading = false;
      state.cartItems = action.payload.items;
      state.totalAmount = action.payload.totalAmount;
      state.totalQuantity = action.payload.totalQuantity;
    });
    builder.addCase(updateCartItemQuantity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Failed to update item quantity';
    });
    
    // Handle removeCartItem
    builder.addCase(removeCartItem.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeCartItem.fulfilled, (state, action) => {
      state.loading = false;
      state.cartItems = action.payload.items;
      state.totalAmount = action.payload.totalAmount;
      state.totalQuantity = action.payload.totalQuantity;
    });
    builder.addCase(removeCartItem.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Failed to remove item';
    });
    
    // Handle clearCart
    builder.addCase(clearCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(clearCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cartItems = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
    });
    builder.addCase(clearCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'Failed to clear cart';
    });
    }
});

export const { addItem, deleteCartItem, incrementItemQuantity, decrementItemQuantity, clearCartLocal} = cartSlice.actions;

export default cartSlice.reducer;