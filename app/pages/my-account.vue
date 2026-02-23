<template>
  <div class="my-account-page bg-grey-lighten-4 min-h-screen py-10">
    <v-container class="custom-container">
      <!-- Page Header -->
      <div class="d-flex justify-space-between align-center mb-8">
        <h1 class="text-h4 font-weight-bold">User Dashboard</h1>
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0">
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right" size="small"></v-icon>
          </template>
        </v-breadcrumbs>
      </div>

      <v-row>
        <!-- Left Sidebar -->
        <v-col cols="12" md="3">
          <v-card class="rounded-xl border pa-0 overflow-hidden sticky-sidebar" elevation="0">
            <!-- User Info Header -->
            <div class="pa-8 text-center bg-white border-b">
              <v-avatar size="100" color="grey-lighten-4" class="mb-4 border">
                <v-icon icon="mdi-account" size="60" color="grey-lighten-1"></v-icon>
              </v-avatar>
              <h2 class="text-h6 font-weight-bold mb-1">{{ auth.user?.name || 'User Name' }}</h2>
              <p class="text-caption text-grey">{{ auth.user?.email || 'user@example.com' }}</p>
            </div>

            <!-- Sidebar Navigation -->
            <v-list class="py-0 sidebar-list" density="comfortable">
              <v-list-item
                v-for="item in menuItems"
                :key="item.id"
                :value="item.id"
                :class="{ 'active-menu-item': activeTab === item.id }"
                @click="activeTab = item.id"
                class="py-4 px-8"
              >
                <template v-slot:prepend>
                  <v-icon :icon="item.icon" class="mr-4" :color="activeTab === item.id ? 'primary' : 'grey-darken-1'"></v-icon>
                </template>
                <v-list-item-title class="font-weight-medium" :class="{ 'text-primary': activeTab === item.id }">
                  {{ item.title }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Right Content Area -->
        <v-col cols="12" md="9">
          <v-card class="rounded-xl border pa-8 pa-md-10" elevation="0" min-height="600">
            <v-window v-model="activeTab">
              <!-- Dashboard Tab -->
              <v-window-item value="dashboard">
                <div class="dashboard-content">
                  <h2 class="text-h4 font-weight-bold mb-2">My Dashboard</h2>
                  <p class="mb-4 text-body-1">Hello, <strong>{{ auth.user?.name }}</strong></p>
                  <p class="text-grey-darken-1 mb-8">
                    From your My Account Dashboard you have the ability to view a snapshot of your recent account activity and update your account information. Select a link below to view or edit information.
                  </p>

                  <!-- Stats Row -->
                  <v-row class="mb-10">
                    <v-col cols="12" md="4" v-for="stat in dashStats" :key="stat.label">
                      <v-card class="stat-card border rounded-xl pa-6 d-flex align-center position-relative overflow-hidden" elevation="0">
                        <div class="stat-icon-wrapper rounded-lg pa-4 mr-4" :style="{ backgroundColor: stat.bgColor }">
                          <v-icon :icon="stat.icon" :color="stat.color" size="32"></v-icon>
                        </div>
                        <div>
                          <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">{{ stat.label }}</div>
                          <div class="text-h4 font-weight-black">{{ stat.value }}</div>
                        </div>
                        <!-- Background Decoration Icons -->
                        <v-icon :icon="stat.icon" class="stat-bg-icon" size="80"></v-icon>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Info Section -->
                  <div class="account-info-section">
                    <h3 class="text-h5 font-weight-bold mb-6 border-b pb-4">Account Information</h3>
                    
                    <v-row>
                      <!-- Contact Info -->
                      <v-col cols="12" md="6">
                        <h4 class="text-subtitle-1 font-weight-bold mb-4 text-grey-darken-3">Contact Information</h4>
                        <div class="info-content text-body-2">
                          <p class="mb-1 font-weight-medium">{{ auth.user?.name }}</p>
                          <p class="mb-4">{{ auth.user?.email }}</p>
                          <NuxtLink to="#" class="text-primary text-decoration-none font-weight-bold">Change Password</NuxtLink>
                        </div>
                      </v-col>

                      <!-- Newsletter -->
                      <v-col cols="12" md="6">
                        <h4 class="text-subtitle-1 font-weight-bold mb-4 text-grey-darken-3">Newsletters</h4>
                        <div class="info-content text-body-2">
                          <p class="text-grey">You are currently not subscribed to any newsletter</p>
                        </div>
                      </v-col>
                    </v-row>

                    <v-row class="mt-8">
                      <!-- Address Book -->
                      <v-col cols="12">
                        <div class="d-flex justify-space-between align-center mb-4">
                          <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-3">Address Book</h4>
                          <NuxtLink to="#" class="text-primary text-decoration-none font-weight-bold" @click.prevent="activeTab = 'address'">Edit</NuxtLink>
                        </div>
                        
                        <div class="border-t pt-4">
                          <h5 class="text-caption text-grey-darken-1 text-uppercase font-weight-bold mb-2">Default Shipping Address</h5>
                          <div v-if="addressStore.defaultAddress" class="text-body-2">
                            <p>{{ addressStore.defaultAddress.name }}</p>
                            <p>{{ addressStore.defaultAddress.address_line_1 }}</p>
                            <p v-if="addressStore.defaultAddress.address_line_2">{{ addressStore.defaultAddress.address_line_2 }}</p>
                            <p>{{ addressStore.defaultAddress.city }}, {{ addressStore.defaultAddress.state }}, {{ addressStore.defaultAddress.zipcode }}</p>
                          </div>
                          <p v-else class="text-body-2 text-grey">You have not set a default shipping address.</p>
                          
                          <NuxtLink to="#" class="text-primary text-decoration-none font-weight-bold mt-4 d-inline-block" @click.prevent="activeTab = 'address'">
                            {{ addressStore.defaultAddress ? 'Change Address' : 'Edit Address' }}
                          </NuxtLink>
                        </div>
                      </v-col>
                    </v-row>
                  </div>
                </div>
              </v-window-item>

              <!-- Order Tab -->
              <v-window-item value="order">
                <div class="order-history-content">
                  <h2 class="text-h4 font-weight-bold mb-8">My Orders History</h2>
                  
                  <div v-if="orders.length > 0">
                    <v-card
                      v-for="order in orders"
                      :key="order.id"
                      class="order-main-card border rounded-xl pa-6 mb-8"
                      elevation="0"
                    >
                      <!-- Order Header Info -->
                      <div class="d-flex align-start mb-6">
                        <div class="status-icon-box rounded-circle pa-3 mr-4 bg-blue-lighten-5">
                          <v-icon icon="mdi-package-variant-closed" color="primary"></v-icon>
                        </div>
                        <div class="flex-grow-1">
                          <div class="d-flex align-center mb-1">
                            <h3 class="text-h6 font-weight-bold mr-3">{{ getStatusLabel(order.status) }}</h3>
                            <v-chip
                              :color="getStatusColor(order.status)"
                              size="x-small"
                              variant="flat"
                              class="text-uppercase font-weight-bold px-3 rounded-lg"
                              style="height: 22px;"
                            >
                              {{ order.status }}
                            </v-chip>
                            <v-spacer></v-spacer>
                            <span class="text-caption text-grey font-weight-medium">#{{ order.order_number }}</span>
                          </div>
                          <p class="text-body-2 text-grey-darken-1 mb-0">
                            Ordered on {{ new Date(order.created_at).toLocaleDateString() }} • Total: ${{ order.total_amount }}
                          </p>
                        </div>
                      </div>

                      <!-- Order Items List -->
                      <div class="order-items-wrapper bg-grey-lighten-5 rounded-xl pa-4 pa-md-6">
                        <v-row v-for="(item, idx) in order.items" :key="item.id" :class="{ 'mt-6': idx > 0, 'border-t pt-6': idx > 0 }">
                          <!-- Product Image -->
                          <v-col cols="12" sm="3" md="2" class="d-flex justify-center">
                            <v-img
                              :src="item.product?.cover_thumbnail_url || '/placeholder-product.png'"
                              width="120"
                              height="120"
                              class="rounded-lg border bg-white"
                              cover
                            ></v-img>
                          </v-col>
                          
                          <!-- Item Details -->
                          <v-col cols="12" sm="9" md="10">
                            <div class="d-flex flex-column h-100">
                              <h4 class="text-h6 font-weight-bold mb-1">{{ item.product_name }}</h4>
                              <p class="text-body-2 text-grey mb-4 line-clamp-2">
                                {{ item.product?.summary || 'No description available.' }}
                              </p>
                              
                              <v-row no-gutters class="mt-auto">
                                <v-col cols="6" sm="3">
                                  <div class="text-caption text-grey">Price :</div>
                                  <div class="text-body-1 font-weight-black">${{ item.price }}</div>
                                </v-col>
                                <v-col cols="6" sm="3">
                                  <div class="text-caption text-grey">Rate :</div>
                                  <div class="d-flex align-center mt-1">
                                    <v-rating
                                      :model-value="item.product?.rating || 4"
                                      color="amber-darken-1"
                                      density="compact"
                                      size="small"
                                      readonly
                                      half-increments
                                    ></v-rating>
                                  </div>
                                </v-col>
                                <v-col cols="6" sm="3" class="mt-4 mt-sm-0">
                                  <div class="text-caption text-grey">Sold By :</div>
                                  <div class="text-body-1 font-weight-bold text-primary">FGX Store</div>
                                </v-col>
                                <v-col cols="6" sm="3" class="mt-4 mt-sm-0">
                                  <div class="text-caption text-grey">Quantity :</div>
                                  <div class="text-body-1 font-weight-bold">{{ item.quantity }} {{ item.product?.unit || 'Units' }}</div>
                                </v-col>
                              </v-row>
                            </div>
                          </v-col>
                        </v-row>
                      </div>
                    </v-card>
                  </div>

                  <div v-else class="text-center py-16 bg-white border rounded-xl">
                    <v-icon icon="mdi-package-variant-closed" size="80" color="grey-lighten-2" class="mb-6"></v-icon>
                    <h3 class="text-h5 font-weight-bold mb-2">No Orders Yet</h3>
                    <p class="text-grey mb-8">It looks like you haven't placed any orders yet.</p>
                    <v-btn to="/products" color="primary" rounded="lg" class="px-10 text-none" height="48">Start Shopping</v-btn>
                  </div>
                </div>
              </v-window-item>

              <!-- Wishlist Tab -->
              <v-window-item value="wishlist">
                <div class="wishlist-content">
                  <h2 class="text-h4 font-weight-bold mb-8">My Wishlist</h2>
                  
                  <v-row v-if="wishlistStore.items.length > 0">
                    <v-col 
                      v-for="product in wishlistStore.items" 
                      :key="product.id" 
                      cols="12" 
                      sm="6" 
                      md="4"
                    >
                      <ProductCard :product="product" @quick-view="openQuickView" />
                    </v-col>
                  </v-row>

                  <div v-else class="text-center py-16 bg-white border rounded-xl">
                    <v-icon icon="mdi-heart-outline" size="80" color="grey-lighten-2" class="mb-6"></v-icon>
                    <h3 class="text-h5 font-weight-bold mb-2">Your wishlist is empty</h3>
                    <p class="text-grey mb-8">Save your favorite items here to wrap them up later!</p>
                    <v-btn to="/products" color="primary" rounded="lg" class="px-10 text-none" height="48">Explore Products</v-btn>
                  </div>
                </div>
              </v-window-item>

              <!-- Address Tab -->
              <v-window-item value="address">
                <div class="address-content">
                  <div class="d-flex justify-space-between align-center mb-10">
                    <h2 class="text-h4 font-weight-bold">My Address Book</h2>
                    <v-btn
                      color="secondary"
                      class="text-none font-weight-bold px-6"
                      rounded="lg"
                      height="48"
                      prepend-icon="mdi-plus"
                      @click="openAddAddress"
                    >
                      Add New Address
                    </v-btn>
                  </div>

                  <v-row v-if="addressStore.addresses.length > 0">
                    <v-col
                      v-for="address in addressStore.addresses"
                      :key="address.id"
                      cols="12"
                      md="6"
                      lg="6"
                    >
                      <v-card
                        class="address-card-v2 border rounded-xl pa-6"
                        :class="{ 'active-address-card': address.is_default }"
                        elevation="0"
                      >
                        <div class="d-flex justify-space-between align-start mb-6">
                          <div class="d-flex align-center">
                            <v-radio
                              :model-value="address.is_default ? address.id : null"
                              :value="address.id"
                              color="secondary"
                              class="ma-0 pa-0 mr-3"
                              @click="addressStore.setDefault(address.id)"
                              hide-details
                              :readonly="address.is_default"
                            ></v-radio>
                            <span class="text-h6 font-weight-bold text-grey-darken-4">{{ address.name }}</span>
                          </div>
                          <v-chip
                            size="small"
                            color="secondary"
                            variant="flat"
                            class="px-3 font-weight-bold text-uppercase"
                            rounded="lg"
                          >
                            {{ address.type || 'Home' }}
                          </v-chip>
                        </div>

                        <div class="address-body mb-8">
                          <div class="d-flex mb-2">
                            <span class="label text-grey-darken-1 mr-2">Address :</span>
                            <span class="value text-grey-darken-3 font-weight-medium">
                              {{ address.address_line_1 }}, {{ address.address_line_2 ? address.address_line_2 + ',' : '' }} {{ address.city }}, {{ address.state }} {{ address.zipcode }}
                            </span>
                          </div>
                          <div class="d-flex mb-2">
                            <span class="label text-grey-darken-1 mr-2">Pin Code :</span>
                            <span class="value text-grey-darken-3 font-weight-medium">+ {{ address.zipcode }}</span>
                          </div>
                          <div class="d-flex">
                            <span class="label text-grey-darken-1 mr-2">Phone :</span>
                            <span class="value text-grey-darken-3 font-weight-medium">{{ address.phone_number }}</span>
                          </div>
                        </div>

                        <v-row no-gutters class="border-t pt-4">
                          <v-col cols="6" class="pr-2">
                            <v-btn
                              block
                              variant="tonal"
                              color="grey-darken-3"
                              class="text-none font-weight-bold"
                              rounded="lg"
                              prepend-icon="mdi-pencil-outline"
                              @click="openEditAddress(address)"
                            >
                              Edit
                            </v-btn>
                          </v-col>
                          <v-col cols="6" class="pl-2">
                            <v-btn
                              block
                              variant="tonal"
                              color="error"
                              class="text-none font-weight-bold"
                              rounded="lg"
                              prepend-icon="mdi-trash-can-outline"
                              @click="deleteAddress(address.id)"
                            >
                              Remove
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-card>
                    </v-col>
                  </v-row>
                  
                  <div v-else class="text-center py-12 bg-grey-lighten-5 rounded-xl border">
                    <v-icon icon="mdi-map-marker-off-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
                    <p class="text-grey-darken-1">No addresses found in your address book.</p>
                  </div>
                </div>

                <!-- Add/Edit Address Dialog -->
                <v-dialog v-model="addressDialog" max-width="600" persistent>
                  <v-card class="rounded-xl pa-6">
                    <v-card-title class="text-h5 font-weight-bold px-0 mb-6">
                      {{ editingAddressId ? 'Update Address' : 'Add New Address' }}
                    </v-card-title>
                    
                    <v-form ref="addressFormRef" @submit.prevent="saveAddress">
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="addressForm.name"
                            label="Full Name"
                            variant="outlined"
                            rounded="lg"
                            :rules="[v => !!v || 'Name is required']"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="addressForm.phone_number"
                            label="Phone Number"
                            variant="outlined"
                            rounded="lg"
                            :rules="[v => !!v || 'Phone is required']"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="addressForm.type"
                            :items="['Home', 'Office', 'Other']"
                            label="Address Type"
                            variant="outlined"
                            rounded="lg"
                          ></v-select>
                        </v-col>
                        <v-col cols="12" md="6">
                           <v-text-field
                            v-model="addressForm.zipcode"
                            label="Zip Code"
                            variant="outlined"
                            rounded="lg"
                            :rules="[v => !!v || 'Zipcode is required']"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            v-model="addressForm.address_line_1"
                            label="Address Line 1"
                            variant="outlined"
                            rounded="lg"
                            :rules="[v => !!v || 'Address is required']"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            v-model="addressForm.address_line_2"
                            label="Address Line 2 (Optional)"
                            variant="outlined"
                            rounded="lg"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="addressForm.city"
                            label="City"
                            variant="outlined"
                            rounded="lg"
                            :rules="[v => !!v || 'City is required']"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="addressForm.state"
                            label="State"
                            variant="outlined"
                            rounded="lg"
                            :rules="[v => !!v || 'State is required']"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-checkbox
                            v-model="addressForm.is_default"
                            label="Make this my default address"
                            color="secondary"
                            hide-details
                          ></v-checkbox>
                        </v-col>
                      </v-row>
                      
                      <div class="d-flex justify-end gap-4 mt-6">
                        <v-btn
                          variant="text"
                          color="grey-darken-1"
                          class="rounded-lg text-none px-6"
                          @click="addressDialog = false"
                        >
                          Cancel
                        </v-btn>
                        <v-btn
                          color="primary"
                          type="submit"
                          class="rounded-lg text-none px-10 font-weight-bold"
                          :loading="addressStore.loading"
                        >
                          {{ editingAddressId ? 'Update' : 'Save' }}
                        </v-btn>
                      </div>
                    </v-form>
                  </v-card>
                </v-dialog>
              </v-window-item>

              <!-- Profile Tab -->
              <v-window-item value="profile">
                <div class="profile-content">
                  <h2 class="text-h4 font-weight-bold mb-8">My Profile</h2>
                  
                  <v-row>
                    <!-- Contact & Address Info -->
                    <v-col cols="12" md="6">
                      <v-card class="border rounded-xl pa-8 h-100" elevation="0">
                        <div class="mb-8">
                          <h3 class="text-h6 font-weight-bold mb-6">Contact Information</h3>
                          <div class="d-flex align-center mb-6">
                            <v-avatar color="primary" size="64" class="mr-6">
                              <span class="text-h5 text-white">{{ auth.user?.name?.charAt(0).toUpperCase() }}</span>
                            </v-avatar>
                            <div>
                              <div class="text-h6 font-weight-bold">{{ auth.user?.name }}</div>
                              <div class="text-body-1 text-grey">{{ auth.user?.email }}</div>
                            </div>
                          </div>
                        </div>

                        <v-divider class="mb-8"></v-divider>

                        <div>
                          <div class="d-flex justify-space-between align-center mb-6">
                            <h3 class="text-h6 font-weight-bold">Primary Address</h3>
                            <v-btn variant="text" color="secondary" class="text-none font-weight-bold px-0" @click="activeTab = 'address'">
                              Change Address
                            </v-btn>
                          </div>
                          
                          <div v-if="primaryAddress" class="bg-grey-lighten-5 rounded-xl pa-6 border">
                            <div class="d-flex align-center mb-4">
                              <v-icon icon="mdi-map-marker" color="secondary" class="mr-2"></v-icon>
                              <span class="font-weight-bold text-uppercase text-caption text-secondary">{{ primaryAddress.type || 'Home' }}</span>
                            </div>
                            <div class="text-body-1 font-weight-bold text-grey-darken-4 mb-2">{{ primaryAddress.name }}</div>
                            <div class="text-body-2 text-grey-darken-1 mb-1">
                              {{ primaryAddress.address_line_1 }}, {{ primaryAddress.address_line_2 ? primaryAddress.address_line_2 + ',' : '' }}
                            </div>
                            <div class="text-body-2 text-grey-darken-1 mb-1">
                              {{ primaryAddress.city }}, {{ primaryAddress.state }} - {{ primaryAddress.zipcode }}
                            </div>
                            <div class="text-body-2 text-grey-darken-1">
                              Phone: {{ primaryAddress.phone_number }}
                            </div>
                          </div>
                          <div v-else class="text-center py-8 bg-grey-lighten-5 rounded-xl border border-dashed">
                            <v-icon icon="mdi-map-marker-plus-outline" color="grey-lighten-1" size="40" class="mb-2"></v-icon>
                            <p class="text-grey mb-4">No primary address set</p>
                            <v-btn color="secondary" size="small" rounded="lg" class="text-none" @click="openAddAddress">Add Address</v-btn>
                          </div>
                        </div>
                      </v-card>
                    </v-col>

                    <!-- Update Password Form -->
                    <v-col cols="12" md="6">
                      <v-card class="border rounded-xl pa-8 h-100" elevation="0">
                        <h3 class="text-h6 font-weight-bold mb-8">Update Password</h3>
                        
                        <v-form ref="passwordFormRef" @submit.prevent="updatePassword">
                          <v-text-field
                            v-model="passwordForm.current_password"
                            label="Current Password"
                            type="password"
                            variant="outlined"
                            rounded="lg"
                            class="mb-4"
                            :rules="[v => !!v || 'Current password is required']"
                          ></v-text-field>

                          <v-text-field
                            v-model="passwordForm.new_password"
                            label="New Password"
                            type="password"
                            variant="outlined"
                            rounded="lg"
                            class="mb-4"
                            :rules="[
                              v => !!v || 'New password is required',
                              v => v.length >= 8 || 'Password must be at least 8 characters'
                            ]"
                          ></v-text-field>

                          <v-text-field
                            v-model="passwordForm.new_password_confirmation"
                            label="Confirm New Password"
                            type="password"
                            variant="outlined"
                            rounded="lg"
                            class="mb-8"
                            :rules="[
                              v => !!v || 'Please confirm your new password',
                              v => v === passwordForm.new_password || 'Passwords do not match'
                            ]"
                          ></v-text-field>

                          <v-btn
                            block
                            color="primary"
                            type="submit"
                            height="54"
                            rounded="lg"
                            class="text-none font-weight-bold"
                            :loading="passwordLoading"
                          >
                            Save Changes
                          </v-btn>
                        </v-form>

                        <div class="mt-8 pa-6 bg-blue-lighten-5 rounded-xl border border-blue-lighten-4">
                          <div class="d-flex align-start">
                            <v-icon icon="mdi-shield-check" color="primary" class="mr-3 mt-1"></v-icon>
                            <div>
                              <div class="text-subtitle-2 font-weight-bold text-primary mb-1">Secure Your Account</div>
                              <p class="text-caption text-grey-darken-1 mb-0">
                                Use at least 8 characters. Mix letters, numbers, and symbols for a stronger password.
                              </p>
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-window-item>

              <!-- Privacy Tab -->
              <v-window-item value="privacy">
                <div class="privacy-content">
                  <h2 class="text-h4 font-weight-bold mb-8">Privacy Settings</h2>
                  
                  <v-row>
                    <v-col cols="12">
                      <!-- Delete Account Section -->
                      <v-card class="border rounded-xl pa-8 mb-8 bg-red-lighten-5 border-red-lighten-4" elevation="0">
                        <div class="d-flex align-start flex-column flex-md-row">
                          <v-icon icon="mdi-alert-octagon" color="error" size="40" class="mr-6 mb-4 mb-md-0"></v-icon>
                          <div class="flex-grow-1">
                            <h3 class="text-h6 font-weight-bold text-error mb-2">Delete Your Account</h3>
                            <p class="text-body-1 text-grey-darken-2 mb-6" style="max-width: 800px;">
                              Closing your account is permanent and cannot be undone. All your personal data, order history, and saved items will be removed from our servers forever. Please proceed with caution.
                            </p>
                            <v-btn
                              color="error"
                              variant="flat"
                              height="48"
                              rounded="lg"
                              class="text-none font-weight-bold px-10"
                              prepend-icon="mdi-trash-can-outline"
                              :loading="deleteLoading"
                              @click="confirmDeleteAccount"
                            >
                              Permanently Delete Account
                            </v-btn>
                          </div>
                        </div>
                      </v-card>

                      <!-- Notifications Section -->
                      <v-card class="border rounded-xl pa-8 mb-8" elevation="0">
                        <h3 class="text-h6 font-weight-bold mb-6">Email Preferences</h3>
                        <div class="d-flex align-center justify-space-between py-4 border-b">
                          <div>
                            <div class="text-subtitle-1 font-weight-bold mb-1">Promotional & Marketing Emails</div>
                            <p class="text-body-2 text-grey mb-0">Receive information about new arrivals, special offers, and store events.</p>
                          </div>
                          <v-switch
                            v-model="promotionalEmails"
                            color="secondary"
                            hide-details
                          ></v-switch>
                        </div>
                      </v-card>

                      <!-- Disclaimer Section -->
                      <v-card class="border rounded-xl pa-8" elevation="0">
                        <h3 class="text-h6 font-weight-bold mb-6">Privacy Disclaimer</h3>
                        <div class="bg-grey-lighten-5 rounded-xl pa-6 border">
                          <p class="text-body-2 text-grey-darken-2 mb-4">
                            By using the FGX Store dashboard, you acknowledge that we collect and process your personal data in accordance with our Privacy Policy. This includes your contact details, order history, and preferences to provide a personalized shopping experience.
                          </p>
                          <p class="text-body-2 text-grey-darken-2 mb-0">
                            We use industry-standard security measures to protect your information. You have the right to request access to, correction of, or deletion of your data at any time. Further dynamic privacy policy details from the administrator will be updated here soon.
                          </p>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <QuickViewModal v-model="showQuickView" :product="selectedProduct" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useWishlistStore } from '~/stores/wishlist'
import { useAddressStore } from '~/stores/address'
import ProductCard from '~/components/product/ProductCard.vue'
import QuickViewModal from '~/components/product/QuickViewModal.vue'

const auth = useAuthStore()
const wishlistStore = useWishlistStore()
const addressStore = useAddressStore()
const config = useRuntimeConfig()
const route = useRoute()

// Tab state
const activeTab = ref(route.query.tab || 'dashboard')

// Quick View state
const showQuickView = ref(false)
const selectedProduct = ref(null)

const openQuickView = (product) => {
  selectedProduct.value = product
  showQuickView.value = true
}

watch(() => route.query.tab, (newTab) => {
  if (newTab) activeTab.value = newTab
})

// Breadcrumbs
const breadcrumbItems = [
  { title: 'Home', disabled: false, href: '/' },
  { title: 'User Dashboard', disabled: true }
]

// Sidebar Menu Items
const menuItems = [
  { id: 'dashboard', title: 'DashBoard', icon: 'mdi-home-outline' },
  { id: 'order', title: 'Order', icon: 'mdi-package-variant-closed' },
  { id: 'wishlist', title: 'Wishlist', icon: 'mdi-heart-outline' },
  { id: 'address', title: 'Address', icon: 'mdi-map-marker-outline' },
  { id: 'profile', title: 'Profile', icon: 'mdi-account-outline' },
  { id: 'privacy', title: 'Privacy', icon: 'mdi-shield-lock-outline' }
]

// Stats Data
const orders = ref([])
const totalOrders = computed(() => orders.value.length)
const pendingOrders = computed(() => orders.value.filter(o => o.status === 'pending').length)

const dashStats = computed(() => [
  {
    label: 'Total Order',
    value: totalOrders.value,
    icon: 'mdi-package-variant-closed',
    color: 'primary',
    bgColor: 'rgba(57, 49, 133, 0.05)'
  },
  {
    label: 'Total Pending Order',
    value: pendingOrders.value,
    icon: 'mdi-clock-outline',
    color: 'secondary',
    bgColor: 'rgba(8, 118, 55, 0.05)'
  },
  {
    label: 'Total Wishlist',
    value: wishlistStore.totalItems,
    icon: 'mdi-heart-outline',
    color: '#E91E63',
    bgColor: 'rgba(233, 30, 99, 0.05)'
  }
])

// Fetch Data
const fetchStats = async () => {
  if (!auth.token) return
  try {
    const res = await $fetch(`${config.public.apiBase}/orders`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    orders.value = res.data || []
  } catch (err) {
    console.error('Error fetching dashboard stats:', err)
  }
}

// Address Handling Logic
const addressDialog = ref(false)
const editingAddressId = ref(null)
const addressFormRef = ref(null)
const addressForm = ref({
  name: '',
  phone_number: '',
  type: 'Home',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  zipcode: '',
  is_default: false
})

// Profile & Password Logic
const passwordFormRef = ref(null)
const passwordLoading = ref(false)
const passwordForm = ref({
  current_password: '',
  new_password: '',
  new_password_confirmation: ''
})

const primaryAddress = computed(() => {
  return addressStore.addresses.find(a => a.is_default) || addressStore.addresses[0] || null
})

const updatePassword = async () => {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return

  passwordLoading.value = true
  try {
    const response = await $fetch(`${config.public.apiBase}/update-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: passwordForm.value
    })
    
    passwordForm.value = {
      current_password: '',
      new_password: '',
      new_password_confirmation: ''
    }
    passwordFormRef.value.reset()
    alert('Password updated successfully')
  } catch (err) {
    console.error('Error updating password:', err)
    alert(err.data?.message || 'Failed to update password')
  } finally {
    passwordLoading.value = false
  }
}

// Privacy Logic
const deleteLoading = ref(false)
const promotionalEmails = ref(true)

const confirmDeleteAccount = async () => {
  const confirmed = confirm('DANGER: This action is permanent. Are you sure you want to delete your account and all associated data?')
  if (!confirmed) return

  const secondConfirmation = confirm('One last check: You will lose access to all your orders and history. Proceed?')
  if (!secondConfirmation) return

  deleteLoading.value = true
  try {
    await $fetch(`${config.public.apiBase}/delete-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    // Clear local storage and state
    auth.logout()
    alert('Account successfully deleted.')
    navigateTo('/')
  } catch (err) {
    console.error('Error deleting account:', err)
    alert(err.data?.message || 'Failed to delete account')
  } finally {
    deleteLoading.value = false
  }
}

const openAddAddress = () => {
  editingAddressId.value = null
  addressForm.value = {
    name: auth.user?.name || '',
    phone_number: '',
    type: 'Home',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zipcode: '',
    is_default: addressStore.addresses.length === 0
  }
  addressDialog.value = true
}

const openEditAddress = (address) => {
  editingAddressId.value = address.id
  addressForm.value = { ...address }
  addressDialog.value = true
}

const saveAddress = async () => {
  const { valid } = await addressFormRef.value.validate()
  if (!valid) return

  try {
    if (editingAddressId.value) {
      await addressStore.updateAddress(editingAddressId.value, addressForm.value)
    } else {
      await addressStore.addAddress(addressForm.value)
    }
    addressDialog.value = false
  } catch (err) {
    console.error('Error saving address:', err)
  }
}

const deleteAddress = async (id) => {
  if (confirm('Are you sure you want to remove this address?')) {
    try {
      await addressStore.$patch(state => {
        state.loading = true
      })
      await $fetch(`${config.public.apiBase}/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      await addressStore.fetchAddresses()
    } catch (err) {
      console.error('Error deleting address:', err)
    } finally {
      addressStore.$patch(state => {
        state.loading = false
      })
    }
  }
}

// Order Status Helpers
const getStatusLabel = (status) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'Delivers'
    case 'shipped': return 'In Transit'
    case 'delivered': return 'Delivered'
    case 'cancelled': return 'Order Cancelled'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'error'
    case 'delivered':
    case 'success':
    case 'shipped': return 'secondary'
    case 'processing': return 'primary'
    default: return 'grey'
  }
}

onMounted(async () => {
  await Promise.all([
    fetchStats(),
    wishlistStore.fetchWishlist(),
    addressStore.fetchAddresses()
  ])
})
</script>

<script>
definePageMeta({
  middleware: ['auth']
})
</script>

<style scoped lang="scss">
.my-account-page {
  font-family: inherit;
}

.sticky-sidebar {
  position: sticky;
  top: 100px;
}

.sidebar-list {
  .v-list-item {
    transition: all 0.3s ease;
    border-left: 4px solid transparent;
    
    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.03);
    }
  }
}

.active-menu-item {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  border-left-color: rgb(var(--v-theme-primary)) !important;
  
  .v-list-item-title {
    color: rgb(var(--v-theme-primary)) !important;
    font-weight: 700 !important;
  }
}

.stat-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-color: #fff;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important;
  }
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 64px;
}

.stat-bg-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  opacity: 0.03;
  transform: rotate(-15deg);
}

.info-content {
  background-color: #fff;
}

.lh-1 {
  line-height: 1;
}

/* Breadcrumbs Overrides */
:deep(.v-breadcrumbs-item) {
  font-size: 0.875rem;
  color: #666;
}

:deep(.v-breadcrumbs-item--disabled) {
  color: #000;
  font-weight: 600;
}

.address-card-v2 {
  transition: all 0.3s ease;
  background-color: #fff;
  
  &:hover {
    box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important;
  }
  
  .label {
    min-width: 90px;
    font-size: 0.9rem;
  }
  
  .value {
    font-size: 0.95rem;
    line-height: 1.5;
  }
}

.active-address-card {
  border: 2px solid rgb(var(--v-theme-secondary)) !important;
  background-color: rgba(var(--v-theme-secondary), 0.02);
}

.gap-4 {
  gap: 16px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>
