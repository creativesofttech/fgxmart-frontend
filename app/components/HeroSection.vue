<template>
  <v-container fluid class="pa-0 hero-container" v-if="!pending">
    <!-- Desktop View: 3-Panel Grid -->
    <v-row no-gutters class="fill-height d-none d-md-flex" v-if="activeSlides.length > 0">
      <v-col 
        v-for="slide in activeSlides.slice(0, 3)" 
        :key="slide.id"
        cols="4" 
        class="hero-panel"
        :style="{ backgroundColor: slide.background_color }"
      >
        <div class="panel-content">
          <h1 
            class="panel-title mb-6"
            :style="{ 
              fontSize: slide.title_font_size, 
              fontWeight: slide.title_font_weight, 
              color: slide.title_color,
              fontFamily: slide.title_font_family,
              lineHeight: '1.1'
            }"
          >
            {{ slide.title }}
          </h1>
          <p 
            class="panel-description mb-10"
            :style="{ 
              fontSize: slide.subtitle_font_size, 
              fontWeight: slide.subtitle_font_weight, 
              color: slide.subtitle_color,
              fontFamily: slide.subtitle_font_family
            }"
          >
            {{ slide.subtitle }}
          </p>
          <v-btn
            v-if="slide.cta_text"
            :to="slide.cta_url"
            class="panel-btn text-none rounded-pill px-8"
            elevation="0"
            height="46"
            :style="{ 
              backgroundColor: slide.cta_bg_color, 
              color: slide.cta_text_color,
              fontWeight: slide.cta_font_weight,
              fontSize: slide.cta_font_size
            }"
          >
            {{ slide.cta_text }}
          </v-btn>
        </div>
        <div class="panel-image-wrapper">
          <img 
            v-if="slide.image_path"
            :src="getImageUrl(slide.image_path)" 
            class="panel-image" 
            :style="{ 
              objectFit: slide.image_object_fit, 
              objectPosition: slide.image_object_position 
            }"
            :alt="slide.title"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Mobile View: Carousel -->
    <div class="d-flex d-md-none fill-height" v-if="activeSlides.length > 0">
      <client-only>
        <v-carousel
          hide-delimiter-background
          show-arrows="hover"
          height="100%"
          cycle
        >
          <v-carousel-item
            v-for="slide in activeSlides"
            :key="slide.id"
          >
            <div 
              class="hero-panel fill-height w-100"
              :style="{ backgroundColor: slide.background_color }"
            >
              <div class="panel-content">
                <h1 
                  class="panel-title mb-4"
                  :style="{ 
                    fontSize: '32px', 
                    fontWeight: slide.title_font_weight, 
                    color: slide.title_color,
                    lineHeight: '1.2'
                  }"
                >
                  {{ slide.title }}
                </h1>
                <p 
                  class="panel-description mb-6"
                  :style="{ 
                    fontSize: '15px', 
                    color: slide.subtitle_color
                  }"
                >
                  {{ slide.subtitle }}
                </p>
                <v-btn
                  v-if="slide.cta_text"
                  :to="slide.cta_url"
                  class="panel-btn text-none rounded-pill px-6"
                  elevation="0"
                  height="40"
                  :style="{ 
                    backgroundColor: slide.cta_bg_color, 
                    color: slide.cta_text_color
                  }"
                >
                  {{ slide.cta_text }}
                </v-btn>
              </div>
              <div class="panel-image-wrapper">
                <img 
                  v-if="slide.image_path"
                  :src="getImageUrl(slide.image_path)" 
                  class="panel-image" 
                  :style="{ 
                    objectFit: slide.image_object_fit, 
                    objectPosition: slide.image_object_position 
                  }"
                  :alt="slide.title"
                />
              </div>
            </div>
          </v-carousel-item>
        </v-carousel>
      </client-only>
    </div>

    <!-- Fallback Static Content -->
    <v-row no-gutters class="fill-height" v-else>
      <!-- Panel 1 -->
      <v-col cols="12" md="4" class="hero-panel panel-beige">
        <div class="panel-content">
          <h1 class="panel-title mb-6">Discover Premium Products From Trusted Global Sellers</h1>
          <p class="panel-description mb-10">
            Carefully selected products from trusted sellers, offering quality, value, and a smooth shopping experience.
          </p>
          <v-btn color="#0E4B4C" class="panel-btn text-white rounded-pill px-8" elevation="0" height="46" to="/products">
            Shop Now
          </v-btn>
        </div>
        <div class="panel-image-wrapper">
          <img src="../assets/images/home/home-1.webp" class="panel-image" style="object-position: bottom left;" alt="Premium Bar" />
        </div>
      </v-col>

      <!-- Panel 2 -->
      <v-col cols="12" md="4" class="hero-panel panel-black">
        <div class="panel-content">
          <h1 class="panel-title text-white mb-6">Shop Smart With Carefully Selected Products In One Place</h1>
          <p class="panel-description text-grey-lighten-5 mb-10">
            A modern marketplace bringing together reliable sellers and quality products in one place.
          </p>
          <v-btn color="white" class="panel-btn text-black rounded-pill px-8" elevation="0" height="46" to="/products">
            Shop Now
          </v-btn>
        </div>
        <div class="panel-image-wrapper">
          <img src="../assets/images/home/home-2.webp" class="panel-image" style="object-position: bottom center;" alt="Gourmet Sauce" />
        </div>
      </v-col>

      <!-- Panel 3 -->
      <v-col cols="12" md="4" class="hero-panel panel-grey">
        <div class="panel-content">
          <h1 class="panel-title mb-6">Find Quality Items Designed For Comfort And Daily Use</h1>
          <p class="panel-description mb-10">
            Quality marketplace products selected to match modern lifestyles and smart shopping habits.
          </p>
          <v-btn color="#0E4B4C" class="panel-btn text-white rounded-pill px-8" elevation="0" height="46" to="/products">
            Shop Now
          </v-btn>
        </div>
        <div class="panel-image-wrapper">
          <img src="../assets/images/home/home-3.webp" class="panel-image" style="object-position: bottom right;" alt="Daily Use Items" />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'

const config = useRuntimeConfig()
const { data: slidesResponse, pending } = await useFetch(`${config.public.apiBase}/hero-slides`)

const activeSlides = computed(() => slidesResponse.value?.data || [])

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  // Laravel storage path resolution
  return `${config.public.apiBase.replace('/api/v1', '')}/storage/${path}`
}
</script>

<style scoped>
.hero-container {
  height: 80vh;
  min-height: 600px;
  overflow: hidden;
  position: relative;
}

.hero-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 120px 60px;
  height: 100%;
}

.panel-beige { background-color: #F9F7F2; }
.panel-black { background-color: #000000; }
.panel-grey { background-color: #FAFAFA; }

.panel-content {
  position: relative;
  z-index: 10;
  max-width: 480px;
  padding: 40px 0 0 40px;
}

.panel-title {
  font-size: 48px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -1.5px;
  color: #0E4B4C;
}

.panel-black .panel-title {
  color: #FFFFFF;
}

.panel-description {
  font-size: 17px;
  line-height: 1.5;
  color: #0E4B4C;
  opacity: 0.9;
  max-width: 400px;
}

.panel-black .panel-description {
  color: #FFFFFF;
  opacity: 0.7;
}

.panel-btn {
  text-transform: none;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0;
}

.panel-image-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.panel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 1;
}

@media (max-width: 1440px) {
  .panel-title {
    font-size: 40px;
  }
}

@media (max-width: 960px) {
  .hero-container {
    height: 600px;
  }
  .hero-panel {
    padding: 60px 30px;
  }
  .panel-content {
    padding: 20px 0 0 20px;
  }
}
</style>

