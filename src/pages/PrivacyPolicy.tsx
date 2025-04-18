import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Last updated: April 16, 2025</p>
            
            <h2>Introduction</h2>
            <p>
              Welcome to DeepTerm ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
            </p>
            
            <h2>Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul>
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website and services.</li>
            </ul>
            
            <h2>How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul>
              <li>To provide and maintain our Service.</li>
              <li>To notify you about changes to our Service.</li>
              <li>To provide customer support.</li>
              <li>To gather analysis or valuable information so that we can improve our Service.</li>
              <li>To monitor the usage of our Service.</li>
              <li>To detect, prevent and address technical issues.</li>
            </ul>
            
            <h2>Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track the activity on our Service and store certain information. 
              Cookies are small text files that a website stores on your computer or mobile device when you visit the site.
            </p>
            
            <h3>Types of Cookies We Use</h3>
            <p>The cookies we use can be categorized as follows:</p>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You may not opt-out of these cookies.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website's structure and content.
              </li>
              <li>
                <strong>Marketing and Advertising Cookies:</strong> These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third-party advertisers.
              </li>
            </ul>
            
            <h3>Managing Your Cookie Preferences</h3>
            <p>
              When you first visit our website, you will be presented with a cookie consent banner that allows you to:
            </p>
            <ul>
              <li><strong>Accept All Cookies:</strong> This will allow all types of cookies to be placed on your device.</li>
              <li><strong>Essential Only:</strong> This will only allow essential cookies that are necessary for the website to function properly.</li>
              <li><strong>Decline All:</strong> This will block all cookies except for essential ones required for the website to function.</li>
            </ul>
            <p>
              You can change your cookie preferences at any time by clearing cookies in your browser, which will trigger the cookie consent banner to appear again when you next visit our site.
            </p>
            <p>
              You can also instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our website may not function properly.
            </p>
            
            <h2>Google AdSense</h2>
            <p>
              We use Google AdSense to show advertisements on our website. Google AdSense is a service provided by Google that uses cookies to serve ads based on a user's prior visits to our website or other websites.
            </p>
            <p>
              Google AdSense may use the following technologies:
            </p>
            <ul>
              <li><strong>Cookies:</strong> To serve and manage ads across the web based on your browsing activity.</li>
              <li><strong>Web beacons:</strong> Small invisible graphics that may be used to collect information about your browsing.</li>
              <li><strong>Pixel tags:</strong> Small blocks of code that can do things like read and place cookies, and transmit information to Google.</li>
              <li><strong>Mobile advertising identifiers:</strong> Software-created identifiers that work similar to cookies on mobile devices.</li>
            </ul>
            <p>
              Google AdSense may collect and process data about:
            </p>
            <ul>
              <li>Information about your device and browser</li>
              <li>Your IP address</li>
              <li>Websites you've visited that use Google services</li>
              <li>Your geographic location</li>
              <li>The time of your visit</li>
              <li>In some cases, information about your actions on the website</li>
            </ul>
            <p>
              We have implemented Google AdSense in compliance with its policies, including integrating a cookie consent mechanism that allows you to control whether advertising cookies are used.
            </p>
            <p>
              If you would like more information about personalized advertising practices and to know your choices about not having this information used by Google AdSense, please visit:
            </p>
            <ul>
              <li><a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google's Advertising Policies</a></li>
              <li><a href="https://www.aboutads.info/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a></li>
              <li><a href="https://youradchoices.com/" target="_blank" rel="noopener noreferrer">Your Ad Choices</a></li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
            </p>
            
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please <Link to="/contact">contact us</Link>.
            </p>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
