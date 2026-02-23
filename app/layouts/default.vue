<template>
  <v-app>
    <Header />
    <v-main>
      <slot />
    </v-main>
    <Footer />
  </v-app>
</template>

<script setup>
</script>

<style lang="scss">
// Global Reset/Styles can go here or imported
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Trebuchet MS", sans-serif;
  color: #4a5568;
  line-height: 1.5;
  background-color: #f9f9f9; // Light bg for whole site
}

a { text-decoration: none; color: inherit; }
ul { list-style: none; padding: 0; margin: 0; }
button { font-family: inherit; }
</style>
