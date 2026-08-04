import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import CreateSnippet from "./pages/CreateSnippet";
import ViewSnippet from "./pages/ViewSnippet";
import SuccessScreen from "./pages/SuccessScreen";
import PasswordLock from "./pages/PasswordLock";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/create" component={CreateSnippet} />
        <Route path="/s/:id" component={ViewSnippet} />
        <Route path="/s/:id/success" component={SuccessScreen} />
        <Route path="/s/:id/lock" component={PasswordLock} />
        <Route path="/about" component={About} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster
            theme="light"
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'oklch(0.995 0.004 92)',
                border: '1px solid oklch(0.884 0.012 88)',
                color: 'oklch(0.226 0.016 56)',
                borderRadius: '0.375rem',
              }
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
