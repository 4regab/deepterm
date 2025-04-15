import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2>Introduction</h2>
            <p>
              Welcome to DeepTerm. These Terms of Service ("Terms") govern your use of our website and services. 
              By accessing or using our website, you agree to be bound by these Terms.
            </p>
            
            <h2>Use of Our Services</h2>
            <p>
              You may use our services only as permitted by these terms and any applicable laws. Don't misuse our Services. For example, don't interfere with our Services or try to access them using a method other than the interface and the instructions that we provide.
            </p>
            
            <h2>Your Content</h2>
            <p>
              Our services allow you to upload, submit, store, send or receive content. You retain ownership of any intellectual property rights that you hold in that content. 
              When you upload, submit, store, send or receive content to or through our services, you give us a worldwide license to use, host, store, reproduce, modify, create derivative works, communicate, publish, publicly perform, publicly display and distribute such content.
            </p>
            
            <h2>Privacy</h2>
            <p>
              DeepTerm's privacy practices are explained in our <Link to="/privacy-policy">Privacy Policy</Link>. By using our services, you agree to our collection, use, and sharing of information as described there.
            </p>
            
            <h2>Advertisements</h2>
            <p>
              Our services may display advertisements. These advertisements may be targeted to the content of information stored on the services, queries made through the services, or other information.
            </p>
            
            <h2>Software in Our Services</h2>
            <p>
              Some of our services include downloadable software. We give you permission to use that software as part of the services. The license we give you is non-exclusive, non-transferable, and non-sublicensable.
            </p>
            
            <h2>Modifying and Terminating Our Services</h2>
            <p>
              We are constantly changing and improving our services. We may add or remove functionalities or features, and we may suspend or stop a service altogether.
              You can stop using our services at any time. We may also stop providing services to you, or add or create new limits to our services at any time.
            </p>
            
            <h2>Disclaimers</h2>
            <p>
              We provide our services "as is," without any warranties. Some jurisdictions provide for certain warranties, like the implied warranty of merchantability, fitness for a particular purpose, and non-infringement. To the extent permitted by law, we exclude all warranties.
            </p>
            
            <h2>Limitation of Liability</h2>
            <p>
              To the extent permitted by law, we won't be responsible for lost profits, revenues, or data, financial losses or indirect, special, consequential, exemplary, or punitive damages.
            </p>
            
            <h2>Changes to These Terms</h2>
            <p>
              We may modify these terms or any additional terms that apply to a service to, for example, reflect changes to the law or changes to our services. You should look at the terms regularly. We'll post notice of modifications to these terms on this page.
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have any questions about these Terms, please <Link to="/contact">contact us</Link>.
            </p>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
