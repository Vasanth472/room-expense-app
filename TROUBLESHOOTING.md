# Troubleshooting Guide

## Common Issues and Solutions

### 1. App Won't Start

**Issue**: The app doesn't start or shows errors in the console.

**Solutions**:
- Make sure all dependencies are installed: `npm install`
- Check Node.js version (Angular 17 requires Node.js 18.x or 20.x)
- Clear cache and reinstall: 
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- Check for TypeScript errors: `ng build`

### 2. Routing Not Working

**Issue**: Routes don't navigate or show blank pages.

**Solutions**:
- Verify guards are functional guards (not class-based)
- Check browser console for errors
- Ensure RouterModule is properly imported in AppRoutingModule
- Verify all components are properly exported

### 3. Forms Not Working

**Issue**: Forms don't submit or ngModel doesn't work.

**Solutions**:
- Ensure FormsModule is imported in standalone components
- Check that form controls have `name` attributes
- Verify two-way binding syntax: `[(ngModel)]`

### 4. LocalStorage Issues

**Issue**: Data not persisting or errors accessing localStorage.

**Solutions**:
- Check browser console for localStorage errors
- Ensure browser supports localStorage
- Clear browser cache and localStorage
- Check if localStorage is disabled in browser settings

### 5. Service Worker Issues

**Issue**: Service worker errors or PWA not working.

**Solutions**:
- Service worker is disabled in development mode
- Build for production to enable service worker: `ng build --configuration production`
- Clear service worker cache in browser DevTools

### 6. Component Not Loading

**Issue**: Components don't render or show errors.

**Solutions**:
- Verify component is properly exported
- Check that component is imported in routing
- Ensure all dependencies are imported in component
- Check browser console for specific errors

### 7. TypeScript Errors

**Issue**: TypeScript compilation errors.

**Solutions**:
- Run `ng build` to see all errors
- Check that all types are properly imported
- Verify interface definitions match usage
- Check for missing type declarations

## Running the App

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   ng serve
   ```

3. **Open Browser**:
   - Navigate to `http://localhost:4200`
   - Check browser console for errors

4. **Build for Production**:
   ```bash
   ng build --configuration production
   ```

## Browser Console Errors

If you see errors in the browser console, check:

1. **Module not found**: Verify all imports are correct
2. **Cannot read property**: Check for null/undefined values
3. **Router errors**: Verify routing configuration
4. **Service errors**: Check service dependencies

## Common Error Messages

### "Cannot find module"
- Run `npm install`
- Check import paths
- Verify file exists

### "RouterModule not found"
- Verify @angular/router is installed
- Check AppRoutingModule imports

### "Component is not a module"
- Verify component is standalone: `standalone: true`
- Check imports array in component decorator

### "Cannot read property of undefined"
- Check for null/undefined values
- Add null checks in templates: `*ngIf`
- Verify data is loaded before accessing properties

## Getting Help

If issues persist:

1. Check browser console for specific errors
2. Check terminal for compilation errors
3. Verify Node.js version compatibility
4. Clear browser cache and localStorage
5. Reinstall dependencies

## Testing Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] App compiles (`ng build`)
- [ ] App starts (`ng serve`)
- [ ] Login page loads
- [ ] Can login as admin
- [ ] Can add members
- [ ] Can add expenses
- [ ] Can view expenses as user
- [ ] Can add comments
- [ ] Data persists (localStorage)

