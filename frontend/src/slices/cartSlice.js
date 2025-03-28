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

      const existingItemIndex = state.cartItems.findIndex(
        (item) => item.id === newItem.id
      );
      

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        state.cartItems[existingItemIndex].quantity += 1;
      } else {
        // Item doesn't exist, add new item with quantity 1
        newItem.quantity = 1;
        state.cartItems.push(newItem);
      }
      
      // Update totals
      state.totalQuantity++;
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
    }
  }
});

export const cartActions = cartSlice.actions;

export default cartSlice.reducer;
