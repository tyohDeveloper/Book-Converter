import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Compress from "@/pages/Compress";
import Convert from "@/pages/Convert";
import ConvertHTML from "@/pages/ConvertHTML";
import ConvertDocx from "@/pages/ConvertDocx";
import ConvertEpub from "@/pages/ConvertEpub";
import ConvertHtmlToDocx from "@/pages/ConvertHtmlToDocx";
import ConvertHtmlToPdf from "@/pages/ConvertHtmlToPdf";
import SplitEpub from "@/pages/SplitEpub";
import SplitHtml from "@/pages/SplitHtml";
import CleanHtml from "@/pages/CleanHtml";
import BundleHtml from "@/pages/BundleHtml";
import PasteHtml from "@/pages/PasteHtml";
import ViewRaw from "@/pages/ViewRaw";
import Structure from "@/pages/Structure";
import Combine from "@/pages/Combine";
import Debug from "@/pages/Debug";
import FormatHtmlElements from "@/pages/FormatHtmlElements";
import FormatStyles from "@/pages/FormatStyles";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tools/compress" component={Compress} />
      <Route path="/tools/convert" component={Convert} />
      <Route path="/tools/convert-html" component={ConvertHTML} />
      <Route path="/tools/convert-docx" component={ConvertDocx} />
      <Route path="/tools/convert-epub" component={ConvertEpub} />
      <Route path="/tools/convert-html-to-docx" component={ConvertHtmlToDocx} />
      <Route path="/tools/convert-html-to-pdf" component={ConvertHtmlToPdf} />
      <Route path="/tools/split-epub" component={SplitEpub} />
      <Route path="/tools/split-html" component={SplitHtml} />
      <Route path="/tools/clean-html" component={CleanHtml} />
      <Route path="/tools/bundle-html" component={BundleHtml} />
      <Route path="/tools/paste-html" component={PasteHtml} />
      <Route path="/tools/view-raw" component={ViewRaw} />
      <Route path="/tools/structure" component={Structure} />
      <Route path="/tools/combine" component={Combine} />
      <Route path="/tools/debug" component={Debug} />
      <Route path="/tools/format-html" component={FormatHtmlElements} />
      <Route path="/tools/edit-styles" component={FormatStyles} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster position="top-center" />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
